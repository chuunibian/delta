use std::fs;
use std::path::Path;

use crate::error::AppError;
use crate::platform::appdata_folder_check;

pub fn startup_checks(local_appdata_path: &Path) -> Result<(), AppError> {
    manage_local_appdata_app_folder(local_appdata_path)?; // given app data path it recursively creates necesary folders
    appdata_folder_check(local_appdata_path)?;

    Ok(())
}

pub fn manage_local_appdata_app_folder(local_appdata_path: &Path) -> Result<(), AppError> {
    // given app data path recursively create necesary folders
    // only if they do not currently exist
    fs::create_dir_all(local_appdata_path.join("tempsnapshot"))?;
    Ok(())
}
