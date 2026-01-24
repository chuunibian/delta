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

pub fn manage_local_appdata_app_folder(local_appdata_path: &Path) -> std::io::Result<()> {
    fs::create_dir_all(local_appdata_path.join("tempsnapshot"))?; // recursive dir create all, everything in the given path

    Ok(())
}
