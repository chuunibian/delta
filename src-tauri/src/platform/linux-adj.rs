pub fn startup_checks(local_appdata_path: &Path) -> Result<(), AppError> {
    appdata_folder_check(local_appdata_path)?;
    manage_local_appdata_app_folder(local_appdata_path)?;

    Ok(())
}

pub fn appdata_folder_check(local_appdata_path: &Path) -> Result<(), AppError> {
    // let snapshot_folder = local_appdata_path.join("tempsnapshot");

    // if snapshot_folder.exists() {
    //     let entries = fs::read_dir(snapshot_folder)?;

    //     for entry_result in entries {
    //         let entry = entry_result?;
    //         let entry_path = entry.path();
    //         let entry_path_string = entry.file_name().to_string_lossy().to_string();
    //         let file_name_parts: Vec<&str> = entry_path_string.split('_').collect();

    //         if file_name_parts.len() != 3 {
    //             fs::remove_file(entry_path)?;
    //             return Err(AppError::StartupError(
    //                 "A file in the local storage failed to satisfy name constraints".to_string(),
    //             ));
    //         }

    //         if file_name_parts[0].len() != 1 {
    //             fs::remove_file(entry_path)?;
    //             return Err(AppError::StartupError(
    //                 "A file in the local storage failed to satisfy name constraints. Drive letter is wrong".to_string(),
    //             ));
    //         }

    //         // date is big endian and always 12
    //         if file_name_parts[1].len() != 12 {
    //             fs::remove_file(entry_path)?;
    //             return Err(AppError::StartupError(
    //                 "A file in the local storage failed to satisfy name constraints. Date is wrong"
    //                     .to_string(),
    //             ));
    //         }
    //     }
    // }

    Ok(())
}

pub fn clean_disk_name(disk_name: &str) -> Result<String, AppError> {
    if disk_name.is_empty() {
        return (Err(AppError::GeneralLogicError(
            "Linux drive name is empty".to_string(),
        )));
    }

    // Linux drives is either root or mounted somewhere under root so if not start with / then error
    if !disk_name.starts_with("/") {
        return (Err(AppError::GeneralLogicError(format!(
            "Linux drive name -> {disk_name} does not start with root /",
            disk_name
        ))));
    }

    if disk_name == "/" {
        Ok("root".to_string())
    } else {
        Ok(disk_name.replace('/', ""))
    }
}
