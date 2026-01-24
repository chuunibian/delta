use serde::{Deserialize, Serialize, Serializer};
use std::cmp::Reverse;
use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;
use std::time::SystemTime;

use crate::database;

// NOTE DUPLICATED STRING SAVE IN HASHMAP AND HTE NAME FIELD WE CAN SAVE MEMORY BY USING THE HASHMAP ONE?
// Maybe only remove name from the files to prevent headaches
pub struct BackendState {
    pub file_tree: Mutex<Option<Dir>>, // Overall this is the global in mem rep of what was scanned, thread protecting not sure if needed online does say so since it is global and tauri BE is multi Th
    pub local_appdata_path: Option<PathBuf>,
    // pub chosen_snapshot: Option<String>, // used for appending to lcl_app_path (for selected snapshot) but maybe not use???
}
// ^ for that above consider not using a mutex and something else

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Init_Disk {
    pub name: String,
    pub desc: String,
}

// For this I think date will be a Date object
// then use chrono::NaiveDate this is a type
// parse the file name into letter and unprocessed date
// proces the date and convert into Date obj (2026-01-15)
// send that over to frontend and it will be parsed into Javascript Date

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

// Note we do not need serde here, this is backend only as we are going to send views of dir to frontend
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
    ) -> DirView {
        let temp_stat =
            database::query_stats_from_id(&self, state, prev_snapshot_file_path).unwrap();

        DirView {
            meta: DirViewMeta {
                size: self.meta.size,
                num_files: self.meta.num_files,
                num_subdir: self.meta.num_subdir,
                created: self.meta.created.clone(),
                modified: self.meta.modified.clone(),

                diff: Some(DirViewMetaDiff {
                    new_dir_flag: false,
                    previous_size: temp_stat.size as u64,
                    prev_num_files: temp_stat.sub_file_count as u64,
                    prev_num_subdir: temp_stat.sub_folder_count as u64,
                }),
            },
            name: self.name.clone(),
            id: self.id.to_string(), // need to convert to string here
                                     // subdirviews: Vec::new(),
                                     // files: Vec::new(),
        }
    }

    pub fn get_subdir_and_files_no_diff(&self) -> DirViewChildren {
        DirViewChildren {
            // files: self.files.values().cloned().collect(),
            // need to map File to FileView
            files: self
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
                .collect(),

            subdirviews: self
                .subdirs
                .values() // .values() gets an iterator of &Dir
                .map(|d| d.to_dir_view_unexpanded_no_diff())
                .collect(),
        }
    }

    // This function will need ot know where to actually get the previous history from thus needs that parameter
    pub fn get_subdir_and_files(
        &self,
        state: tauri::State<BackendState>,
        prev_snapshot_file_path: String,
    ) -> DirViewChildren {
        let temp_ht =
            database::query_children_stats_from_parent_id(&self, state, prev_snapshot_file_path)
                .unwrap();

        let mut file_view_vec: Vec<FileView> = Vec::new();
        let mut dir_view_vec: Vec<DirView> = Vec::new();

        for file in self.files.values() {
            let diff_data = match temp_ht.get(&file.id) {
                Some(prev_data) => Some(FileViewMetaDiff {
                    new_file_flag: false,
                    previous_size: prev_data.size as u64,
                }),
                None => Some(FileViewMetaDiff {
                    new_file_flag: true,
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
            let diff_data = match temp_ht.get(&subdir.id) {
                Some(prev_data) => Some(DirViewMetaDiff {
                    new_dir_flag: false,
                    previous_size: prev_data.size as u64,
                    prev_num_files: prev_data.sub_file_count as u64,
                    prev_num_subdir: prev_data.sub_folder_count as u64,
                }),
                None => Some(DirViewMetaDiff {
                    new_dir_flag: true,
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

        // sort descending
        file_view_vec.sort_by_key(|entry| Reverse(entry.meta.size));
        dir_view_vec.sort_by_key(|entry| Reverse(entry.meta.size));

        DirViewChildren {
            files: file_view_vec,
            subdirviews: dir_view_vec,
        }
    }
}

fn c_str<S>(x: &u64, s: S) -> Result<S::Ok, S::Error>
where
    S: Serializer,
{
    s.serialize_str(&x.to_string())
}
