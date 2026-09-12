use std::fs;
use std::path::{Path, PathBuf};

use crate::error::AppError;
use crate::platform::appdata_folder_check;

// Design fix: run portable ("no install") off a `data/` folder next to the
// executable when one is present or a `portable.txt` marker asks for it,
// falling back to the OS-managed app-data directory otherwise (installed
// mode, or the exe directory isn't writable e.g. Program Files).
// See docs/designDeltaPortableApp.md (part A).
pub fn resolve_storage_root(installed_app_data_dir: PathBuf) -> PathBuf {
    let exe_dir = match std::env::current_exe().ok().and_then(|p| p.parent().map(|p| p.to_path_buf())) {
        Some(dir) => dir,
        None => return installed_app_data_dir,
    };

    let wants_portable = exe_dir.join("portable.txt").exists() || exe_dir.join("data").exists();
    if !wants_portable {
        return installed_app_data_dir;
    }

    let portable_data_dir = exe_dir.join("data");
    if fs::create_dir_all(&portable_data_dir).is_err() {
        return installed_app_data_dir;
    }

    let write_probe = portable_data_dir.join(".delta_write_test");
    match fs::write(&write_probe, []) {
        Ok(()) => {
            let _ = fs::remove_file(&write_probe);
            portable_data_dir
        }
        Err(_) => installed_app_data_dir,
    }
}

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
