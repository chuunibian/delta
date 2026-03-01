use std::fs;
use std::path::Path;

use crate::error::AppError;

// Checks Appdata/local application folder for malformed files, and cleans the folder if there is
pub fn appdata_folder_check(local_appdata_path: &Path) -> Result<(), AppError> {
    let snapshot_folder = local_appdata_path.join("tempsnapshot");
    let mut error_flag = false;

    let entries = fs::read_dir(snapshot_folder)?;

    for entry_result in entries {
        let entry = entry_result?;
        let entry_path = entry.path();
        let entry_path_string = entry.file_name().to_string_lossy().to_string();
        let file_name_parts: Vec<&str> = entry_path_string.split('_').collect();

        let temp_valid_flag = if let [drive, date, _size] = file_name_parts.as_slice() {
            drive.len() == 1 && date.len() == 12
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

// For windows the drive name is mapped to the character name
pub fn clean_disk_name(disk_name: &str) -> Result<String, AppError> {
    if disk_name.is_empty() {
        return Err(AppError::GeneralLogicalErr(
            "Windows disk name is empty".to_string(),
        ));
    }

    let first_char =
        disk_name
            .chars()
            .next()
            .map(|c| c.to_string())
            .ok_or(AppError::GeneralLogicalErr(
                "Unable to get first letter of windows disk name".to_string(),
            ))?;

    Ok(first_char)
}
