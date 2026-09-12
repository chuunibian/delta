use model::BackendState;
use tauri::Manager;
use tauri_plugin_dialog::{DialogExt, MessageDialogKind};

use crate::error::AppError;

mod database;
mod disk; // compile my stuff
mod error;
mod model;
mod startup;
mod platform;
mod fs_commands;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

// register the function in the invoke handler
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let local_app_data_path = match app.path().app_local_data_dir() {
                Ok(path) => path,
                Err(_) => {
                    app.dialog()
                    .message(
                        "Fatal Error: An error has occured during app startup. 
                        The app cannot get it's local appdata path. 
                        This is likely due to a corrupted OS environment or missing environment variables. 
                        The application cannot function without this path and will now exit.")
                    .kind(MessageDialogKind::Error)
                    .title("Startup Error")
                    .blocking_show();

                    return Err(Box::new(AppError::CustomError("Failed app startup".to_string())));
                }
            };

            // Design fix: prefer a portable data folder next to the executable when
            // available, so the app can run with no install and no OS-scoped storage.
            // See docs/designDeltaPortableApp.md (part A).
            let storage_root = startup::resolve_storage_root(local_app_data_path);

            if let Err(e) = startup::startup_checks(&storage_root) {
                app.dialog()
                    .message(format!(
                        "An error has occured during app startup: {}",
                        e.to_string()
                    ))
                    .kind(MessageDialogKind::Error)
                    .title("Startup Error")
                    .blocking_show();
            }

            let state = BackendState {
                file_tree: std::sync::Mutex::new(None),
                snapshot_storage_root: Some(storage_root),
            };
            app.manage(state);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            greet,
            disk::retreive_disks,
            disk::disk_scan,
            disk::query_new_dir_object,
            database::write_current_tree,
            database::get_local_snapshot_files,
            database::delete_snapshot_file,
            database::get_path_historical_data,
            fs_commands::get_snapshot_storage_path,
            database::compare_two_snapshots,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
