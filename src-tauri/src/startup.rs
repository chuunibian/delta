/*
    mvp function
    placeholder to manage db files
    need rendition as this powers other stuffs right now

    the rendition for this is the app data thing

    Note that we would also have to be checking the appdata local storage
    because that is where the db stuff should go

    Notes on how to do that are in tauri links, apparently you can do it but not sure.
    there is a function in the docs local_data_dir and also app_local_data_dir for the app's specific
    folder

*/
use std::fs;
use std::path::Path;

use serde_json::map::Entry;

pub fn manage_binary_db_files(local_appdata_path: &Path) -> std::io::Result<()> {
    // println!("{}", local_appdata_path.display());

    let prev_file_path = local_appdata_path.join("prev_data.db");
    let temp_file_path = local_appdata_path.join("temp_data.db");

    if temp_file_path.exists() {
        if prev_file_path.exists() {
            fs::remove_file(&prev_file_path)?;
        }

        fs::rename(&temp_file_path, &prev_file_path)?;
    } else {
        if prev_file_path.exists() {
            // if prev_data exists need to clear it as we want a clean one (since no temp_data means no prev data) auto created later
            fs::remove_file(&prev_file_path)?;
        }
    }

    Ok(())
}

// pub fn startup_local_data_cleaner() {

// }

pub fn appdata_folder_check(local_appdata_path: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let snapshot_folder = local_appdata_path.join("tempsnapshot");

    if snapshot_folder.exists() {
        let entries = fs::read_dir(snapshot_folder)?;

        for entry_result in entries {
            let entry = entry_result?;
            let entry_path = entry.path();
            let entry_path_string = entry.file_name().to_string_lossy().to_string();
            let file_name_parts: Vec<&str> = entry_path_string.split('_').collect();

            if file_name_parts.len() != 3 {
                fs::remove_file(entry_path)?;
                return Err(
                    "A file in the local storage failed to satisfy name constraints".into(),
                );
            }

            if file_name_parts[0].len() != 1 {
                fs::remove_file(entry_path)?;
                return Err(
                    "A file in the local storage failed to satisfy name constraints. Drive letter is wrong".into(),
                );
            }

            // date is big endian and always 12
            if file_name_parts[1].len() != 12 {
                fs::remove_file(entry_path)?;
                return Err(
                    "A file in the local storage failed to satisfy name constraints. Date is wrong"
                        .into(),
                );
            }
        }
    }

    Ok(())
}

pub fn manage_local_appdata_app_folder(local_appdata_path: &Path) -> std::io::Result<()> {
    fs::create_dir_all(local_appdata_path.join("tempsnapshot"))?; // recursive dir create all, everything in the given path

    Ok(())
}
