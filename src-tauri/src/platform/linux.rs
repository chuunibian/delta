use std::fs;
use std::path::Path;

use crate::error::AppError;

// Checks .local application folder for malformed files, and cleans the folder if there is
pub fn appdata_folder_check(local_appdata_path: &Path) -> Result<(), AppError> {
    let snapshot_folder = local_appdata_path.join("tempsnapshot");
    let mut error_flag = false;

    if !snapshot_folder.exists() {
        return Err(AppError::StartupError(
            "Local storage snapshot folder does not exist.".to_string(),
        ));
    }

    let entries = fs::read_dir(snapshot_folder)?;

    for entry_result in entries {
        let entry = entry_result?;
        let entry_path = entry.path();
        let entry_path_string = entry.file_name().to_string_lossy().to_string();
        let file_name_parts: Vec<&str> = entry_path_string.split('_').collect();

        let temp_valid_flag = if let [drive, date, size] = file_name_parts.as_slice() {
            date.len() == 12
        } else {
            false
        };

        if !temp_valid_flag {
            error_flag = true;
            fs::remove_file(entry_path)?;
        }
    }

    if error_flag == true {
        return Err(AppError::StartupError(
            "File(s) in the local storage failed to satisfy name constraints".to_string(),
        ));
    }

    Ok(())
}

pub fn clean_disk_name(disk_name: &str) -> Result<String, AppError> {
    if disk_name.is_empty() {
        return (Err(AppError::GeneralLogicalErr(
            "Linux drive name is empty".to_string(),
        )));
    }

    // Linux drives is either root or mounted somewhere under root so if not start with / then error
    if !disk_name.starts_with("/") {
        return (Err(AppError::GeneralLogicalErr(format!(
            "Linux drive name -> {disk_name} does not start with root /"
        ))));
    }

    if disk_name == "/" {
        Ok("root".to_string())
    } else {
        Ok(disk_name.replace('/', ""))
    }
}
