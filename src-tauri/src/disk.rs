use humansize::{format_size, DECIMAL};
use std::collections::HashMap;
use std::fs::{self};
use std::path::PathBuf;
use std::time::SystemTime;
use sysinfo::Disks;
use tauri::{AppHandle, Emitter};
use twox_hash::XxHash64;
use walkdir::WalkDir;

use crate::error::AppError;
use crate::model::{self, BackendState, Init_Disk};

fn hash_path_id(path: &str) -> u64 {
    let seed = 420;
    let hash = XxHash64::oneshot(seed, path.as_bytes()); // need as bytes since &str is same bytes but typing says it is bytes that are text
    hash
}

#[tauri::command]
pub fn retreive_disks() -> Result<Vec<Init_Disk>, AppError> {
    let disks = Disks::new_with_refreshed_list();
    let mut disk_list = Vec::new();

    if disks.is_empty() {
        return Err(AppError::GeneralLogicalErr(
            "No disks found while retrieving disks".to_string(),
        ));
    }

    for disk in &disks {
        let total_size = format_size(disk.total_space(), DECIMAL);
        let size_remaining = format_size(disk.available_space(), DECIMAL);

        disk_list.push(Init_Disk {
            name: disk.mount_point().to_string_lossy().to_string(),
            desc: format!(
                "{} free {} total {}",
                disk.mount_point().to_string_lossy().to_string(),
                size_remaining,
                total_size,
            ),
        });
    }

    Ok(disk_list)
}

// NOTE
// https://v2.tauri.app/develop/calling-rust/#async-commands

// NOTE
// The tauri stae '_ is a lifetime param

#[tauri::command]
pub async fn disk_scan(
    target: String,
    state: tauri::State<'_, BackendState>,
    app: AppHandle,
    snapshot_file: String, // String, I think can bind the initial root scan input to this entry func or make a new func (decouple) for that
    snapshot_flag: bool,   // temp? for the inital root (also thsi func) to compare or not compare
) -> Result<model::DirView, AppError> {
    println!("Starting Scan");

    // let root = naive_scan(&target)?; // populate the data structure
    let root = match naive_scan(&target, app) {
        Ok(root) => root,
        Err(e) => return Err(e),
    };

    let root_view = match snapshot_flag {
        true => root.to_dir_view_unexpanded(state.clone(), snapshot_file)?,
        false => root.to_dir_view_unexpanded_no_diff(), // unexpanded initally
    };

    // make the global state have the FS object
    let mut file_tree = state.file_tree.lock().unwrap();
    *file_tree = Some(root); // deref the mutex guard then assign

    Ok(root_view)
}

#[tauri::command]
pub fn query_new_dir_object(
    path_list: Vec<String>,
    state: tauri::State<BackendState>,
    snapshot_flag: bool,
    prev_snapshot_file_path: String, // < - frontend manages what snapshto file to compare to and it sends in that path to here to query
) -> Result<model::DirViewChildren, AppError> {
    // This asks state for file_tree mutex and locks it to become mutexguard holding Option<Dir>
    let file_tree = state.file_tree.lock().unwrap();

    if let Some(root_dir) = file_tree.as_ref() {
        // using as ref for &Dir we dont want to take ownership of the Dir from the Global State

        let mut current_dir = root_dir; // temp variable, needs to be mut, a mutable ref to a ref of dir, basically you can reassign this var to different ref of Dirs but cannot modify them since not &mut Dir

        for part in &path_list {
            current_dir = current_dir.subdirs.get(part).ok_or_else(|| {
                AppError::GeneralLogicalErr(format!(
                    "Requested query path has word {} which was not found in that directory",
                    part
                ))
            })?;
        }

        if snapshot_flag == false {
            Ok(current_dir.get_subdir_and_files_no_diff())
        } else {
            current_dir.get_subdir_and_files(state.clone(), prev_snapshot_file_path)
        }
    } else {
        Err(AppError::GeneralLogicalErr(
            "There is no root Dir object in backend memory state".to_string(),
        ))
    }
}

pub fn naive_scan(target: &str, app: AppHandle) -> Result<model::Dir, AppError> {
    let mut hash_store_dir: HashMap<PathBuf, model::Dir> = HashMap::new();
    let mut hash_store_file: HashMap<PathBuf, model::File> = HashMap::new();

    let walker = WalkDir::new(target)
        .contents_first(true)
        .follow_links(false);

    let mut current_dir_size: u64 = 0;

    let mut test_entry_progress_counter: u64 = 0;

    for entry_result in walker {
        if let Ok(entry) = entry_result {
            test_entry_progress_counter += 1; // [TEMP]
            if test_entry_progress_counter % 10000 == 0 {
                app.emit("progress", test_entry_progress_counter)?;
            }

            if entry.file_type().is_file() {
                if let Ok(file_meta) = entry.metadata() {
                    // Create a file node with its details and push to the hashmap for it
                    let new_file_node = model::File {
                        meta: model::FileMeta {
                            size: file_meta.len(),
                            created: file_meta.created().unwrap_or(SystemTime::UNIX_EPOCH),
                            modified: file_meta.accessed().unwrap_or(SystemTime::UNIX_EPOCH),
                        },
                        name: entry.file_name().to_string_lossy().to_string(),
                        id: {
                            if let Some(temp) = entry.path().to_str() {
                                hash_path_id(temp)
                            } else {
                                hash_path_id("err")
                            }
                        },
                    };

                    hash_store_file.insert(entry.path().to_path_buf(), new_file_node);
                }
            } else if entry.file_type().is_dir() {
                if let Ok(directory_meta) = entry.metadata() {
                    current_dir_size = 0;

                    if let Ok(temp_fs_read_dir) = fs::read_dir(entry.path().to_path_buf()) {
                        let mut new_dir_node = model::Dir {
                            name: entry.file_name().to_string_lossy().to_string(),
                            files: HashMap::new(),
                            subdirs: HashMap::new(),
                            meta: model::DirMeta {
                                size: 0, // file.metadata does not give full size so to calc manually set to 0 on creation
                                created: directory_meta.created().unwrap_or(SystemTime::UNIX_EPOCH),
                                modified: directory_meta
                                    .accessed()
                                    .unwrap_or(SystemTime::UNIX_EPOCH),
                                num_files: 0, // I believe you can get these from the previous entry variable
                                num_subdir: 0,
                            },
                            id: {
                                if let Some(temp) = entry.path().to_str() {
                                    hash_path_id(temp)
                                } else {
                                    hash_path_id("thereisnothingthisisjusttestchangelater")
                                }
                            },
                        };

                        for temp_entry_result in temp_fs_read_dir {
                            if let Ok(temp_entry) = temp_entry_result {
                                if let Ok(temp_entry_type) = temp_entry.file_type() {
                                    if temp_entry_type.is_dir() {
                                        if let Some(hashed_dir) =
                                            hash_store_dir.remove(&temp_entry.path())
                                        {
                                            current_dir_size += hashed_dir.meta.size; // need to increment first as push makes the struct take ownership
                                                                                      // new_dir_node.subdirs.(hashed_dir);
                                            new_dir_node
                                                .subdirs
                                                .insert(hashed_dir.name.clone(), hashed_dir);
                                        }
                                    } else if temp_entry_type.is_file() {
                                        if let Some(hashed_file) =
                                            hash_store_file.remove(&temp_entry.path())
                                        {
                                            current_dir_size += hashed_file.meta.size;
                                            // new_dir_node.files.push(hashed_file);
                                            new_dir_node
                                                .files
                                                .insert(hashed_file.name.clone(), hashed_file);
                                        }
                                    }
                                    // originally ther was na else statement here
                                }
                            }
                        }

                        new_dir_node.meta.num_files = new_dir_node.files.len() as u64; // usize to u64
                        new_dir_node.meta.num_subdir = new_dir_node.subdirs.len() as u64;
                        new_dir_node.meta.size = current_dir_size; // accumulated length should be here

                        hash_store_dir.insert(entry.path().to_path_buf(), new_dir_node);
                    }
                }
            }
            // Originially there was an else block here but choose to ignore symlinks and other stuff
        }
    }

    // If the structure of the disk scanned then it has only 1 root
    if hash_store_dir.len() == 1 {
        // iter is view only
        // into_iter consumes/takes ownership of it
        let (_root_name, root) = hash_store_dir.into_iter().next().unwrap();

        return Ok(root);
    } else {
        Err(AppError::GeneralLogicalErr(
            "During scan a single root directory for the disk does not exist".to_string(),
        ))
    }
}
