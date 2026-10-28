use chrono::Local;
use chrono::NaiveDateTime;
use rusqlite::{params, Connection};
use std::collections::HashMap;
use std::fs;
use std::path::{Path, PathBuf};

use crate::disk::hash_path_id;
use crate::error::AppError;
use crate::model::{self, BackendState, Node, SnapshotDbMeta};
use crate::platform::clean_disk_name;

// Bumped whenever the snapshot table/columns change shape.
const SNAPSHOT_SCHEMA_VERSION: i64 = 2;
// 1 = legacy absolute-path hash (pre-portability fix), 2 = relative-path hash.
const SNAPSHOT_ID_SCHEME_RELATIVE_PATH: i64 = 2;

#[derive(Clone)]
pub struct SnapshotRecord {
    pub id: i64,
    pub size: i64, // sqlite limitation but should be big enough
    pub dir_flag: bool,
    pub sub_folder_count: i64,
    pub sub_file_count: i64,
}

fn snapshot_dir_path(state: &tauri::State<'_, BackendState>) -> Result<PathBuf, AppError> {
    state
        .snapshot_storage_root
        .as_ref()
        .map(|path| path.join("tempsnapshot"))
        .ok_or_else(|| {
            AppError::StartupError("Snapshot storage root is unavailable in backend state".to_string())
        })
}

fn validate_snapshot_stem(snapshot_stem: &str) -> Result<(), AppError> {
    // Security fix: allowlist-only filename stem (matches the drive/date/size
    // format we generate in write_current_tree) instead of blacklisting known-bad
    // characters, so no separator/traversal/reserved-name variant can slip through.
    let is_valid = !snapshot_stem.is_empty()
        && snapshot_stem
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '_' || c == '-');

    if !is_valid {
        return Err(AppError::GeneralLogicalErr(
            "Invalid snapshot filename provided".to_string(),
        ));
    }

    Ok(())
}

fn snapshot_db_path(
    state: &tauri::State<'_, BackendState>,
    snapshot_stem: &str,
) -> Result<PathBuf, AppError> {
    validate_snapshot_stem(snapshot_stem)?;
    Ok(snapshot_dir_path(state)?.join(format!("{}.db", snapshot_stem)))
}

// This for query stats for a specific ID
// currently used when calling from a Dir object (Dir object .function get data)
// Overall not needed can both use utility way but just keeping both separate
pub fn query_stats_from_id(
    dir: &model::Dir,
    state: tauri::State<BackendState>,
    prev_snapshot_file_path: String,
) -> Result<SnapshotRecord, AppError> {
    let prev_data_db_path = snapshot_db_path(&state, &prev_snapshot_file_path)?;

    let default_record = SnapshotRecord {
        id: dir.id as i64,
        size: 0,
        dir_flag: true,
        sub_folder_count: 0,
        sub_file_count: 0,
    };

    let try_fetch = || -> Result<SnapshotRecord, rusqlite::Error> {
        let conn = Connection::open(&prev_data_db_path)?;

        let stats = conn.query_row(
            "SELECT * FROM snapshot WHERE id == ?1",
            [dir.id as i64], // this needs conv since id is u64 but sqllite cannot recog that
            |row| {
                Ok(SnapshotRecord {
                    id: row.get(0)?,
                    size: row.get(1)?,
                    dir_flag: row.get(2)?,
                    sub_folder_count: row.get(3)?,
                    sub_file_count: row.get(4)?,
                })
            },
        )?;

        Ok(stats)
    };

    let final_stats = try_fetch().unwrap_or(default_record);

    Ok(final_stats)
}

// Used as utility for any given hashed ID and correct path to DB file
// Will return row if there is, if there is not then throws error (no defaults)
pub fn query_stats_from_id_utility(id: u64, db_path: &Path) -> Result<SnapshotRecord, AppError> {
    let try_fetch = || -> Result<SnapshotRecord, rusqlite::Error> {
        let conn = Connection::open(&db_path)?;

        let stats = conn.query_row(
            "SELECT * FROM snapshot WHERE id == ?1",
            [id as i64], // this needs conv since id is u64 but sqllite cannot recog that
            |row| {
                Ok(SnapshotRecord {
                    id: row.get(0)?,
                    size: row.get(1)?,
                    dir_flag: row.get(2)?,
                    sub_folder_count: row.get(3)?,
                    sub_file_count: row.get(4)?,
                })
            },
        )?;

        Ok(stats)
    };

    let stats = try_fetch()?;

    Ok(stats)
}

// Needs a parameter for which db file to actually query from
pub fn query_children_stats_from_parent_id(
    parent_dir: &model::Dir,
    state: tauri::State<BackendState>,
    prev_snapshot_file_path: String,
) -> Result<HashMap<u64, SnapshotRecord>, AppError> {
    let prev_data_db_path = snapshot_db_path(&state, &prev_snapshot_file_path)?;

    let parent_id = parent_dir.id;

    let conn = Connection::open(&prev_data_db_path)?;
    let mut stmt = conn.prepare("SELECT * FROM snapshot WHERE parent_id == ?")?;
    let mut rows = stmt.query([parent_id as i64])?; // rows match to snapshot record

    let mut temp_ht: HashMap<u64, SnapshotRecord> = HashMap::new();

    while let Some(row) = rows.next()? {
        let entry: SnapshotRecord = SnapshotRecord {
            id: (row.get(0)?),
            size: (row.get(1)?),
            dir_flag: (row.get(2)?),
            sub_folder_count: (row.get(3)?),
            sub_file_count: (row.get(4)?),
        };

        temp_ht.insert(entry.id as u64, entry); // for each row insert into the hash map
    }

    return Ok(temp_ht);
}

// write to that string as db file name, and the frontend is sending that name over
// TODO change selected_disk_letter to drive name! For linux need to handle it
#[tauri::command]
pub async fn write_current_tree(
    state: tauri::State<'_, BackendState>,
    selected_disk: String,
) -> Result<(), AppError> {
    // Performance fix: clone root once and release global tree lock before IO-heavy DB writes.
    let root = {
        let guard = state.file_tree.lock().map_err(|_| {
            AppError::GeneralLogicalErr("Backend tree state lock is poisoned".to_string())
        })?;

        match guard.as_ref() {
            Some(root_ref) => root_ref.clone(),
            None => return Ok(()),
        }
    };

    let root_size_bytes = root.meta.size;

    let local_time = Local::now();

    let selected_disk_name = clean_disk_name(&selected_disk)?;

    let temp_data_db_path = snapshot_dir_path(&state)?.join(format!(
            "{}_{}_{}.db",
            selected_disk_name,
            local_time.format("%Y%m%d%H%M").to_string(),
            root_size_bytes.to_string()
        ));

    let mut conn = Connection::open(&temp_data_db_path)?;

    // ?? Set Pragmas for speed (since this is temp data)
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;  
         PRAGMA cache_size = 10000;",
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS snapshot (
            id INTEGER PRIMARY KEY,
            size INTEGER NOT NULL,
            dir_flag INTEGER NOT NULL,
            sub_folder_count INTEGER DEFAULT 0,
            sub_file_count INTEGER DEFAULT 0,
            parent_id INTEGER,
            name TEXT NOT NULL DEFAULT ''
        )",
        [],
    )?;

    // Design fix: a small header table makes the snapshot file self-describing
    // (no external context needed to know what it is or whether it's safe to
    // load standalone) so it can be reconstructed into a tree on any machine.
    // See docs/designDeltaPortableApp.md (part C).
    conn.execute(
        "CREATE TABLE IF NOT EXISTS meta (
            schema_version INTEGER NOT NULL,
            root_label TEXT NOT NULL,
            id_scheme INTEGER NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    let temp_transaction = conn.transaction()?;

    temp_transaction.execute(
        "INSERT INTO meta (schema_version, root_label, id_scheme, created_at) VALUES (?1, ?2, ?3, ?4)",
        params![
            SNAPSHOT_SCHEMA_VERSION,
            selected_disk_name,
            SNAPSHOT_ID_SCHEME_RELATIVE_PATH,
            local_time.to_rfc3339(),
        ],
    )?;

    {
        let mut stmt = temp_transaction.prepare(
            "INSERT OR REPLACE INTO snapshot (id, size, dir_flag, sub_folder_count, sub_file_count, parent_id, name)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        )?;

        let mut stack = Vec::new();
        stack.push((Node::Dir(&root), 0));

        while let Some((node, real_parent_id)) = stack.pop() {
            let id: i64;
            let size: i64;
            let dir_flag: bool;
            let sub_folder_count: i64;
            let sub_file_count: i64;
            let name: &str;

            match node {
                Node::File(temp_file) => {
                    id = temp_file.id as i64;
                    size = temp_file.meta.size as i64;
                    dir_flag = false;
                    sub_folder_count = 0;
                    sub_file_count = 0;
                    name = &temp_file.name;
                }
                Node::Dir(temp_dir) => {
                    id = temp_dir.id as i64;
                    size = temp_dir.meta.size as i64;
                    dir_flag = true;
                    sub_folder_count = temp_dir.meta.num_subdir as i64;
                    sub_file_count = temp_dir.meta.num_files as i64;
                    name = &temp_dir.name;

                    for file in temp_dir.files.values() {
                        stack.push((Node::File(file), id));
                    }
                    for subdir in temp_dir.subdirs.values() {
                        stack.push((Node::Dir(subdir), id));
                    }
                }
            }

            stmt.execute(params![
                id,
                size,
                dir_flag,
                sub_folder_count,
                sub_file_count,
                real_parent_id,
                name
            ])?;
        }
    }

    temp_transaction.commit()?;

    Ok(())
}

#[tauri::command]
pub fn get_local_snapshot_files(
    state: tauri::State<'_, BackendState>,
) -> Result<Vec<SnapshotDbMeta>, AppError> {
    let temp_data_db_path = snapshot_dir_path(&state)?;

    let mut vec_file_names = Vec::new();

    for entry in fs::read_dir(&temp_data_db_path)? {
        let entry = entry?; // entry is a Result
        let path = entry.path();

        if path.is_file() && path.extension().and_then(|x| x.to_str()) == Some("db") {
            let file_path_name = path
                .file_stem()
                .ok_or(AppError::CustomError(
                    "Path failed to get file stem".to_string(),
                ))?
                .to_string_lossy()
                .to_string(); // file stem removes the file extension

            vec_file_names.push(parse_snapshot_file_name(&file_path_name)?);
        }
    }

    return Ok(vec_file_names);
}

// For this func it should given a path name return the snapshot db file object
fn parse_snapshot_file_name(path: &String) -> Result<SnapshotDbMeta, AppError> {
    let path_segmented: Vec<&str> = path.split("_").collect();

    if path_segmented.len() != 3 {
        return Err(AppError::GeneralLogicalErr(
            "Invalid formatted snapshot file found in app local storage. Restart App.".to_string(),
        ));
    }

    if let [drive_name, date, size] = path_segmented.as_slice() {
        // naivedatetime parse from str should turn somethin like 20261220HHMM to a string
        let snapshot_meta = SnapshotDbMeta {
            drive_letter: drive_name.to_string(),
            date_time: NaiveDateTime::parse_from_str(date, "%Y%m%d%H%M")?.to_string(),
            date_sort_key: date.parse::<u64>()?,
            size: size.parse::<u64>()?,
        };

        return Ok(snapshot_meta);
    } else {
        return Err(AppError::GeneralLogicalErr(
            "Cannot parse malformed snapshot filename. Restart application".to_string(),
        ));
    };
}

#[tauri::command]
pub fn delete_snapshot_file(
    selected_row_file_name: String,
    state: tauri::State<'_, BackendState>,
) -> Result<bool, AppError> {
    let snapshot_dir = snapshot_dir_path(&state)?;
    let prev_data_db_path = snapshot_db_path(&state, &selected_row_file_name)?;

    // Security fix: ensure the resolved target still lives under the snapshot directory.
    let canonical_snapshot_dir = fs::canonicalize(&snapshot_dir)?;
    let canonical_target = fs::canonicalize(&prev_data_db_path)?;
    if !canonical_target.starts_with(&canonical_snapshot_dir) {
        return Err(AppError::GeneralLogicalErr(
            "Refusing to delete file outside snapshot storage directory".to_string(),
        ));
    }

    fs::remove_file(prev_data_db_path)?;

    // Using fs delete also catch the error for that if needed on the passed in path (such as if X does not exist)

    Ok(true)
}

// pub fn get_path_historical_data(
//     root_path: String,
//     absolute_path: String,
//     state: tauri::State<'_, BackendState>,
// ) -> Result<Vec<(String, i64)>, AppError> {
//     let prev_data_db_path: std::path::PathBuf = state
//         .local_appdata_path
//         .as_ref()
//         .unwrap()
//         .join("tempsnapshot");

//     let cleaned_name = clean_disk_name(&root_path)?;
//     let id = hash_path_id(&absolute_path);

//     let mut data_vec: Vec<(String, i64)> = Vec::new();

//     for entry in fs::read_dir(&prev_data_db_path)? {
//         let entry_result = entry?;
//         let path = entry_result.path(); // abs path of each db file
//         let file_path_name = path
//             .file_stem()
//             .ok_or(AppError::CustomError(
//                 "Path failed to get file stem".to_string(),
//             ))?
//             .to_string_lossy()
//             .to_string();

//         let path_segmented: Vec<&str> = file_path_name.split('_').collect();

//         if let [drive_name, date, size] = path_segmented.as_slice() {
//             if *drive_name == cleaned_name {
//                 if let Ok(temp_states) = query_stats_from_id_utility(id, &path) {
//                     let parsed_date = NaiveDateTime::parse_from_str(date, "%Y%m%d%H%M")?;
//                     data_vec.push((
//                         // 2026-03-18 format
//                         parsed_date.format("%Y-%m-%d").to_string(),
//                         temp_states.size,
//                     ));
//                 }
//             }
//         } else {
//             return Err(AppError::GeneralLogicalErr(
//                 "Cannot parse malformed snapshot filename. Restart application".to_string(),
//             ));
//         }
//     }

//     data_vec.sort_by_key(|tuple| tuple.0.clone());

//     return Ok(data_vec);
// }


// This approach in some cases might be wastefully slow worse than the old solution
// at scale if user has 1000 then they wil need to wait about 1 second aroud to get the data back
// in the future maybe can think of optimize
#[tauri::command]
pub fn get_path_historical_data(
    root_path: String,
    absolute_path: String,
    state: tauri::State<'_, BackendState>,
) -> Result<Vec<(String, i64)>, AppError> {
    let prev_data_db_path = snapshot_dir_path(&state)?;
    let cleaned_name = clean_disk_name(&root_path)?;

    let id = hash_path_id(&absolute_path);

    let mut data_vec: Vec<(String, i64)> = Vec::new();

    for entry in fs::read_dir(&prev_data_db_path)? {
        let entry_result = entry?;
        let path = entry_result.path(); // abs path of each db file
        if path.extension().and_then(|x| x.to_str()) != Some("db") {
            continue;
        }

        let file_path_name = path
            .file_stem()
            .ok_or(AppError::CustomError(
                "Path failed to get file stem".to_string(),
            ))?
            .to_string_lossy()
            .to_string();

        let path_segmented: Vec<&str> = file_path_name.split('_').collect();

        // Performance fix: only query snapshot files matching the selected root/drive.
        if let [drive_name, date, _size] = path_segmented.as_slice() {
            if *drive_name == cleaned_name {
                if let Ok(temp_states) = query_stats_from_id_utility(id, &path) {
                    let parsed_date = NaiveDateTime::parse_from_str(date, "%Y%m%d%H%M")?;
                    data_vec.push((
                        // 2026-03-18 format
                        parsed_date.format("%Y-%m-%d").to_string(),
                        temp_states.size,
                    ));
                }
            }
        } else {
            // Put your error handling back here for malformed .db filenames
            return Err(AppError::GeneralLogicalErr(
                "Cannot parse malformed snapshot filename. Restart application".to_string(),
            ));
        }
    }

    data_vec.sort_by_key(|tuple| tuple.0.clone());

    return Ok(data_vec);
}

struct SnapshotRow {
    id: u64,
    size: u64,
    dir_flag: bool,
    sub_folder_count: u64,
    sub_file_count: u64,
    parent_id: u64,
    name: String,
}

// Design fix: rebuild a full in-memory Dir tree from a snapshot DB file alone,
// with no live scan or original machine required. This is what makes a
// snapshot file portable/self-contained and is the basis for comparing two
// saved snapshots against each other. See docs/designDeltaPortableApp.md (part C).
pub fn load_tree_from_snapshot(db_path: &Path) -> Result<model::Dir, AppError> {
    let conn = Connection::open(db_path)?;

    // Snapshots written before this change have no `meta` table / `name`
    // column and cannot be reconstructed into a standalone tree.
    conn.query_row("SELECT schema_version FROM meta", [], |_| Ok(()))
        .map_err(|_| {
            AppError::GeneralLogicalErr(
                "This snapshot predates standalone loading support. Rescan and save a new snapshot to use this feature.".to_string(),
            )
        })?;

    let mut stmt = conn.prepare(
        "SELECT id, size, dir_flag, sub_folder_count, sub_file_count, parent_id, name FROM snapshot",
    )?;
    let rows = stmt.query_map([], |row| {
        Ok(SnapshotRow {
            id: row.get::<_, i64>(0)? as u64,
            size: row.get::<_, i64>(1)? as u64,
            dir_flag: row.get(2)?,
            sub_folder_count: row.get::<_, i64>(3)? as u64,
            sub_file_count: row.get::<_, i64>(4)? as u64,
            parent_id: row.get::<_, i64>(5)? as u64,
            name: row.get(6)?,
        })
    })?;

    let mut by_id: HashMap<u64, SnapshotRow> = HashMap::new();
    let mut children_by_parent: HashMap<u64, Vec<u64>> = HashMap::new();

    for row_result in rows {
        let row = row_result?;
        children_by_parent.entry(row.parent_id).or_default().push(row.id);
        by_id.insert(row.id, row);
    }

    // write_current_tree always pushes the root with parent id 0.
    let root_id = children_by_parent
        .get(&0)
        .and_then(|ids| ids.first())
        .copied()
        .ok_or_else(|| AppError::GeneralLogicalErr("Snapshot has no root entry".to_string()))?;

    build_dir_from_rows(root_id, &by_id, &children_by_parent)
}

fn build_dir_from_rows(
    id: u64,
    by_id: &HashMap<u64, SnapshotRow>,
    children_by_parent: &HashMap<u64, Vec<u64>>,
) -> Result<model::Dir, AppError> {
    let row = by_id
        .get(&id)
        .ok_or_else(|| AppError::GeneralLogicalErr("Snapshot tree references a missing row id".to_string()))?;

    let mut dir = model::Dir {
        name: row.name.clone(),
        files: HashMap::new(),
        subdirs: HashMap::new(),
        meta: model::DirMeta {
            size: row.size,
            num_files: row.sub_file_count,
            num_subdir: row.sub_folder_count,
            // Timestamps aren't stored in the snapshot table today; a loaded
            // tree reads as epoch here rather than the original scan time.
            created: std::time::SystemTime::UNIX_EPOCH,
            modified: std::time::SystemTime::UNIX_EPOCH,
        },
        id: row.id,
    };

    let Some(child_ids) = children_by_parent.get(&id) else {
        return Ok(dir);
    };

    for &child_id in child_ids {
        let child_row = by_id
            .get(&child_id)
            .ok_or_else(|| AppError::GeneralLogicalErr("Snapshot tree references a missing row id".to_string()))?;

        if child_row.dir_flag {
            let child_dir = build_dir_from_rows(child_id, by_id, children_by_parent)?;
            dir.subdirs.insert(child_dir.name.clone(), child_dir);
        } else {
            dir.files.insert(
                child_row.name.clone(),
                model::File {
                    meta: model::FileMeta {
                        size: child_row.size,
                        created: std::time::SystemTime::UNIX_EPOCH,
                        modified: std::time::SystemTime::UNIX_EPOCH,
                    },
                    name: child_row.name.clone(),
                    id: child_row.id,
                },
            );
        }
    }

    Ok(dir)
}

// Flattens an entire loaded tree into the same shape a DB query for one
// parent's children would return, indexed by parent id, so a snapshot loaded
// into memory can be diffed against with the exact same comparison logic
// used for live-tree-vs-DB (see model::Dir::diff_with_stats).
fn flatten_tree_by_parent(root: &model::Dir) -> HashMap<u64, HashMap<u64, SnapshotRecord>> {
    let mut out: HashMap<u64, HashMap<u64, SnapshotRecord>> = HashMap::new();
    flatten_tree_by_parent_recursive(root, 0, &mut out);
    out
}

fn flatten_tree_by_parent_recursive(
    dir: &model::Dir,
    parent_id: u64,
    out: &mut HashMap<u64, HashMap<u64, SnapshotRecord>>,
) {
    out.entry(parent_id).or_default().insert(
        dir.id,
        SnapshotRecord {
            id: dir.id as i64,
            size: dir.meta.size as i64,
            dir_flag: true,
            sub_folder_count: dir.meta.num_subdir as i64,
            sub_file_count: dir.meta.num_files as i64,
        },
    );

    for file in dir.files.values() {
        out.entry(dir.id).or_default().insert(
            file.id,
            SnapshotRecord {
                id: file.id as i64,
                size: file.meta.size as i64,
                dir_flag: false,
                sub_folder_count: 0,
                sub_file_count: 0,
            },
        );
    }

    for subdir in dir.subdirs.values() {
        flatten_tree_by_parent_recursive(subdir, dir.id, out);
    }
}

// Design fix (part D): diff two saved snapshots against each other, reusing
// the exact same view/diff model as live-vs-snapshot. Both snapshot files are
// fully loaded into memory per call; this is simple and correct but not
// cached across calls — fine for interactive use, worth revisiting if this
// becomes a hot path on very large trees.
#[tauri::command]
pub fn compare_two_snapshots(
    current_snapshot_file: String,
    comparison_snapshot_file: String,
    path_list: Vec<String>,
    state: tauri::State<'_, BackendState>,
) -> Result<model::DirViewChildren, AppError> {
    let current_db_path = snapshot_db_path(&state, &current_snapshot_file)?;
    let comparison_db_path = snapshot_db_path(&state, &comparison_snapshot_file)?;

    let current_root = load_tree_from_snapshot(&current_db_path)?;
    let comparison_root = load_tree_from_snapshot(&comparison_db_path)?;

    let mut current_dir = &current_root;
    for part in &path_list {
        current_dir = current_dir.subdirs.get(part).ok_or_else(|| {
            AppError::GeneralLogicalErr(format!(
                "Requested query path has word {} which was not found in that snapshot",
                part
            ))
        })?;
    }

    let mut comparison_by_parent = flatten_tree_by_parent(&comparison_root);
    let child_stats = comparison_by_parent
        .remove(&current_dir.id)
        .unwrap_or_default();

    Ok(current_dir.diff_with_stats(child_stats))
}
