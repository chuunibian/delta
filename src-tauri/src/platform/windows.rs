use std::fs;
use std::path::Path;

use crate::error::AppError;

pub fn appdata_folder_check(local_appdata_path: &Path) -> Result<(), AppError> {
    let snapshot_folder = local_appdata_path.join("tempsnapshot");

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

        if file_name_parts.len() != 3 {
            fs::remove_file(entry_path)?;
            return Err(AppError::StartupError(
                "A file in the local storage failed to satisfy name constraints".to_string(),
            ));
        }

        if file_name_parts[0].len() != 1 {
            fs::remove_file(entry_path)?;
            return Err(AppError::StartupError(
                "A file in the local storage failed to satisfy name constraints. Drive letter is wrong".to_string(),
            ));
        }

        // date is big endian and always 12
        if file_name_parts[1].len() != 12 {
            fs::remove_file(entry_path)?;
            return Err(AppError::StartupError(
                "A file in the local storage failed to satisfy name constraints. Date is wrong"
                    .to_string(),
            ));
        }
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
