use serde::{Deserialize, Serialize, Serializer};
use std::cmp::Reverse;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::SystemTime;

use crate::database;
use crate::error::AppError;

pub struct BackendState {
    pub file_tree: Mutex<Option<Dir>>, // Overall this is the global in mem rep of what was scanned, thread protecting not sure if needed online does say so since it is global and tauri BE is multi Th
    pub local_appdata_path: Option<PathBuf>,
}
// ^ for that above consider not using a mutex and something else

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Init_Disk {
    pub name: String,
    pub desc: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Snapshot_db_meta {
    pub drive_letter: String,
    pub date_time: String,
    pub date_sort_key: u64,
    pub size: u64,
}

pub enum Node<'a> {
    // currently used for iterative traversal only,
    Dir(&'a Dir),
    File(&'a File),
}

pub struct Dir {
    pub name: String,
    pub files: HashMap<String, File>,
    pub subdirs: HashMap<String, Dir>,
    pub meta: DirMeta,
    pub id: u64, // id is geneated from the hasher hashing paht
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DirView {
    meta: DirViewMeta,
    name: String,
    id: String, // Dir has id as u64 but this cannot be handled by javascript so impl needs to convert there is two wasy you can do it here or you can maybe make serde do it before but since the file does not have a view version we dont do it in the future this will be a conforminty change
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileView {
    meta: FileViewMeta, // this needs to be changed
    name: String,
    id: String,
}

// The subdir and files of a dir
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DirViewChildren {
    subdirviews: Vec<DirView>,
    files: Vec<FileView>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct File {
    pub meta: FileMeta,
    pub name: String,

    #[serde(serialize_with = "c_str")]
    pub id: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DirMeta {
    pub size: u64,
    pub num_files: u64,
    pub num_subdir: u64,

    pub created: SystemTime,
    pub modified: SystemTime,
}

// Note that dirMeta is for Dir only not the dir view,
// dir view meta will have the values from teh database
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DirViewMeta {
    pub size: u64,
    pub num_files: u64,
    pub num_subdir: u64,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub diff: Option<DirViewMetaDiff>,

    pub created: SystemTime,
    pub modified: SystemTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DirViewMetaDiff {
    pub new_dir_flag: bool,
    pub deleted_dir_flag: bool,
    pub previous_size: u64,
    pub prev_num_files: u64,
    pub prev_num_subdir: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileMeta {
    pub size: u64,
    pub created: SystemTime,
    pub modified: SystemTime,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileViewMetaDiff {
    pub new_file_flag: bool,
    pub deleted_file_flag: bool,
    pub previous_size: u64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileViewMeta {
    pub size: u64,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub diff: Option<FileViewMetaDiff>,

    pub created: SystemTime,
    pub modified: SystemTime,
}

pub struct AppHealth {}

impl Init_Disk {
    pub fn new(name: String, desc: String) -> Self {
        Self { name, desc }
    }
}

impl Dir {
    pub fn to_dir_view_unexpanded_no_diff(&self) -> DirView {
        DirView {
            meta: DirViewMeta {
                size: self.meta.size,
                num_files: self.meta.num_files,
                num_subdir: self.meta.num_subdir,
                created: self.meta.created,
                modified: self.meta.modified,
                diff: None, // no history
            },
            name: self.name.clone(),
            id: self.id.to_string(),
        }
    }

    // For now decide to use this to handle the root case
    // The root case db query also needs to be made in isolation I think
    // TODO CHANGE THE NAME???
    pub fn to_dir_view_unexpanded(
        &self,
        state: tauri::State<BackendState>,
        prev_snapshot_file_path: String,
    ) -> Result<DirView, AppError> {
        let temp_stat = database::query_stats_from_id(&self, state, prev_snapshot_file_path)?;

        Ok(DirView {
            meta: DirViewMeta {
                size: self.meta.size,
                num_files: self.meta.num_files,
                num_subdir: self.meta.num_subdir,
                created: self.meta.created.clone(),
                modified: self.meta.modified.clone(),

                // This is a bug pretty sure, need to check if temp_stat is empty
                diff: Some(DirViewMetaDiff {
                    new_dir_flag: false,
                    deleted_dir_flag: false,
                    previous_size: temp_stat.size as u64,
                    prev_num_files: temp_stat.sub_file_count as u64,
                    prev_num_subdir: temp_stat.sub_folder_count as u64,
                }),
            },
            name: self.name.clone(),
            id: self.id.to_string(),
        })
    }

    pub fn get_subdir_and_files_no_diff(&self) -> DirViewChildren {
        let mut file_view_vec: Vec<FileView> = self
            .files
            .values()
            .map(|file| FileView {
                name: file.name.clone(),
                id: file.id.to_string(),

                meta: FileViewMeta {
                    size: file.meta.size,
                    created: file.meta.created,
                    modified: file.meta.modified,
                    diff: None,
                },
            })
            .collect();

        let mut dir_view_vec: Vec<DirView> = self
            .subdirs
            .values() // .values() gets an iterator of &Dir
            .map(|d| d.to_dir_view_unexpanded_no_diff())
            .collect();

        file_view_vec.sort_by_key(|entry| Reverse(entry.meta.size));
        dir_view_vec.sort_by_key(|entry| Reverse(entry.meta.size));

        DirViewChildren {
            files: file_view_vec,

            subdirviews: dir_view_vec,
        }
    }

    // This function will need ot know where to actually get the previous history from thus needs that parameter
    pub fn get_subdir_and_files(
        &self,
        state: tauri::State<BackendState>,
        prev_snapshot_file_path: String,
    ) -> Result<DirViewChildren, AppError> {
        let mut temp_ht =
            database::query_children_stats_from_parent_id(&self, state, prev_snapshot_file_path)?;

        let mut file_view_vec: Vec<FileView> = Vec::new();
        let mut dir_view_vec: Vec<DirView> = Vec::new();

        for file in self.files.values() {
            let diff_data = match temp_ht.remove(&file.id) {
                Some(prev_data) => Some(FileViewMetaDiff {
                    new_file_flag: false,
                    deleted_file_flag: false,
                    previous_size: prev_data.size as u64,
                }),
                None => Some(FileViewMetaDiff {
                    // default val
                    new_file_flag: true,
                    deleted_file_flag: false,
                    previous_size: 0,
                }),
            };

            let temp_file_view = FileView {
                meta: FileViewMeta {
                    size: file.meta.size,
                    created: file.meta.created,
                    modified: file.meta.modified,
                    diff: diff_data,
                },
                name: file.name.clone(),
                id: file.id.to_string(),
            };

            file_view_vec.push(temp_file_view);
        }

        for subdir in self.subdirs.values() {
            let diff_data = match temp_ht.remove(&subdir.id) {
                Some(prev_data) => Some(DirViewMetaDiff {
                    new_dir_flag: false,
                    deleted_dir_flag: false,
                    previous_size: prev_data.size as u64,
                    prev_num_files: prev_data.sub_file_count as u64,
                    prev_num_subdir: prev_data.sub_folder_count as u64,
                }),
                None => Some(DirViewMetaDiff {
                    new_dir_flag: true,
                    deleted_dir_flag: false,
                    previous_size: 0,
                    prev_num_files: 0,
                    prev_num_subdir: 0,
                }),
            };

            let temp_dir_view = DirView {
                name: subdir.name.clone(),
                id: subdir.id.to_string(),
                meta: DirViewMeta {
                    size: subdir.meta.size,
                    num_files: subdir.meta.num_files,
                    num_subdir: subdir.meta.num_subdir,
                    created: subdir.meta.created.clone(),
                    modified: subdir.meta.modified.clone(),
                    diff: diff_data,
                },
            };

            dir_view_vec.push(temp_dir_view);
        }

        // Process remaining items in ht | all remaining are files deleted from current when compared to
        for dir_entry in temp_ht {
            match dir_entry.1.dir_flag {
                true => {
                    let temp_diff = Some(DirViewMetaDiff {
                        new_dir_flag: false,
                        deleted_dir_flag: true, // set true
                        previous_size: 0,
                        prev_num_files: 0,
                        prev_num_subdir: 0,
                    });

                    let temp_deleted_dir_view = DirView {
                        name: "[deleted folder]".to_string(), // ATP the db does not store name for space saving
                        id: dir_entry.1.id.to_string(),
                        meta: DirViewMeta {
                            size: dir_entry.1.size as u64, // storing size in the meta, diff will have deleted flag for FE processing
                            num_files: dir_entry.1.sub_file_count as u64,
                            num_subdir: dir_entry.1.sub_file_count as u64,
                            created: SystemTime::UNIX_EPOCH,
                            modified: SystemTime::UNIX_EPOCH,
                            diff: temp_diff,
                        },
                    };

                    dir_view_vec.push(temp_deleted_dir_view);
                }
                false => {
                    let temp_diff = Some(FileViewMetaDiff {
                        new_file_flag: false,
                        deleted_file_flag: true, // set true
                        previous_size: 0,
                    });

                    let temp_deleted_file_view = FileView {
                        name: "[deleted file]".to_string(),
                        id: dir_entry.1.id.to_string(),
                        meta: FileViewMeta {
                            size: dir_entry.1.size as u64,
                            created: SystemTime::UNIX_EPOCH,
                            modified: SystemTime::UNIX_EPOCH,
                            diff: temp_diff,
                        },
                    };

                    file_view_vec.push(temp_deleted_file_view);
                }
            }
        }

        // sort descending
        file_view_vec.sort_by_key(|entry| Reverse(entry.meta.size));
        dir_view_vec.sort_by_key(|entry| Reverse(entry.meta.size));

        Ok(DirViewChildren {
            files: file_view_vec,
            subdirviews: dir_view_vec,
        })
    }
}

fn c_str<S>(x: &u64, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    s.serialize_str(&x.to_string())
}
