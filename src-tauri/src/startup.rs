use std::fs;
use std::path::Path;

use crate::error::AppError;
use crate::platform::appdata_folder_check;

pub fn startup_checks(local_appdata_path: &Path) -> Result<(), AppError> {
    appdata_folder_check(local_appdata_path)?;
    manage_local_appdata_app_folder(local_appdata_path)?;

    Ok(())
}

pub fn manage_local_appdata_app_folder(local_appdata_path: &Path) -> Result<(), AppError> {
    fs::create_dir_all(local_appdata_path.join("tempsnapshot"))?; // recursive dir create all, everything in the given path

    Ok(())
}
