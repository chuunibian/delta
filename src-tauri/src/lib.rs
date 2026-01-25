// Main part of editing for rust backend
use humansize::{format_size, DECIMAL}; // link per file (pre compiled)
use model::BackendState;
use sysinfo::{Disks, System};
use tauri::Manager;

mod database;
mod disk; // compile my stuff
mod error;
mod model;
mod preload;
mod startup;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// register the function in the invoke handler
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let local_appdata_path = app
                .path()
                .app_local_data_dir()
                .expect("Unable to resolve local appdata app path!");

            startup::manage_local_appdata_app_folder(&local_appdata_path)
                .expect("Unable to create local app appdata folder (assuming it not existing)");
            startup::manage_binary_db_files(&local_appdata_path)
                .expect("Unable to manage db files in local appdata");
            startup::appdata_folder_check(&local_appdata_path)
                .expect("File with improper name was found and removed in local data store.");

            let state = BackendState {
                file_tree: std::sync::Mutex::new(None),
                local_appdata_path: app.path().app_local_data_dir().ok(),
            };
            app.manage(state); // set app to manange the state (there is also a manage func but it can't do certain things)

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            disk::retreive_disks,
            disk::disk_scan,
            disk::query_new_dir_object,
            database::write_current_tree,
            database::get_local_snapshot_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
