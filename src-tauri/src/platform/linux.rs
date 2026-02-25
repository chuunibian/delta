use std::fs;
use std::path::Path;

use crate::error::AppError;

pub fn appdata_folder_check(local_appdata_path: &Path) -> Result<(), AppError> {
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
