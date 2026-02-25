use chrono::Local;
use chrono::NaiveDateTime;
use rusqlite::{params, Connection};
use std::collections::HashMap;
use std::fs;

use crate::error::AppError;
use crate::model::{self, BackendState, Node, Snapshot_db_meta};
use crate::platform::clean_disk_name;

pub struct SnapshotRecord {
    pub id: i64,
    pub size: i64,
    pub dir_flag: bool, // uneeded I think id should already tell if dir or file, but can use for redudancy as if same id somehow cahnged from file to folder etc
    pub sub_folder_count: i64,
    pub sub_file_count: i64,
}

// This for query stats for a specific ID
pub fn query_stats_from_id(
    dir: &model::Dir,
    state: tauri::State<BackendState>,
    prev_snapshot_file_path: String,
) -> Result<SnapshotRecord, AppError> {
    let prev_data_db_path: std::path::PathBuf = state
        .local_appdata_path
        .as_ref()
        .unwrap()
        .join("tempsnapshot")
        .join(format!("{}.db", prev_snapshot_file_path));

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

// Needs a parameter for which db file to actually query from
pub fn query_children_stats_from_parent_id(
    parent_dir: &model::Dir,
    state: tauri::State<BackendState>,
    prev_snapshot_file_path: String,
) -> Result<HashMap<u64, SnapshotRecord>, AppError> {
    let prev_data_db_path: std::path::PathBuf = state
        .local_appdata_path
        .as_ref()
        .unwrap()
        .join("tempsnapshot")
        .join(format!("{}.db", prev_snapshot_file_path));

    let parent_id = parent_dir.id;

    let mut conn = Connection::open(&prev_data_db_path)?;
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
    let guard = state.file_tree.lock().unwrap();
    if guard.is_none() {
        return Ok(());
    }
    let root_ref = guard.as_ref().unwrap();
    let root_size_bytes = root_ref.meta.size;

    let local_time = Local::now();

    let selected_disk_name = clean_disk_name(&selected_disk)?;

    let temp_data_db_path = state
        .local_appdata_path
        .as_ref()
        .unwrap()
        .join("tempsnapshot")
        .join(format!(
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
            parent_id INTEGER
        )",
        [],
    )?;

    let temp_transaction = conn.transaction()?;

    {
        let mut stmt = temp_transaction.prepare(
            "INSERT INTO snapshot (id, size, dir_flag, sub_folder_count, sub_file_count, parent_id)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        )?;

        let mut stack = Vec::new();
        stack.push((Node::Dir(root_ref), 0));

        while let Some((node, real_parent_id)) = stack.pop() {
            let id: i64;
            let size: i64;
            let dir_flag: bool;
            let sub_folder_count: i64;
            let sub_file_count: i64;

            match node {
                Node::File(temp_file) => {
                    id = temp_file.id as i64;
                    size = temp_file.meta.size as i64;
                    dir_flag = false;
                    sub_folder_count = 0;
                    sub_file_count = 0;
                }
                Node::Dir(temp_dir) => {
                    id = temp_dir.id as i64;
                    size = temp_dir.meta.size as i64;
                    dir_flag = true;
                    sub_folder_count = temp_dir.meta.num_subdir as i64;
                    sub_file_count = temp_dir.meta.num_files as i64;

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
                real_parent_id
            ])?;
        }
    }

    temp_transaction.commit()?;

    Ok(())
}

#[tauri::command]
pub fn get_local_snapshot_files(
    state: tauri::State<'_, BackendState>,
) -> Result<Vec<Snapshot_db_meta>, AppError> {
    let temp_data_db_path = state
        .local_appdata_path
        .as_ref()
        .unwrap()
        .join("tempsnapshot");

    let mut vec_file_names = Vec::new();

    for entry in fs::read_dir(&temp_data_db_path)? {
        let entry = entry?; // entry is a Result
        let path = entry.path();

        if path.is_file() {
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
fn parse_snapshot_file_name(path: &String) -> Result<Snapshot_db_meta, AppError> {
    let path_segmented: Vec<&str> = path.split("_").collect();

    if path_segmented.len() != 3 {
        return Err(AppError::GeneralLogicalErr(
            "Invalid formatted snapshot file found in app local storage. Restart App.".to_string(),
        ));
    }

    if let [drive_name, date, size] = path_segmented.as_slice() {
        // naivedatetime parse from str should turn somethin like 20261220HHMM to a string
        let snapshot_meta = Snapshot_db_meta {
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
    let prev_data_db_path: std::path::PathBuf = state
        .local_appdata_path
        .as_ref()
        .unwrap()
        .join("tempsnapshot")
        .join(format!("{}.db", selected_row_file_name));

    fs::remove_file(prev_data_db_path)?;

    // Using fs delete also catch the error for that if needed on the passed in path (such as if X does not exist)

    Ok(true)
}
