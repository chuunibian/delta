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
                        "An error has occured during app startup: The app cannot get it's local appdata path")
                    .kind(MessageDialogKind::Error)
                    .title("Startup Error")
                    .blocking_show();

                    return Err(Box::new(AppError::CustomError("Failed app startup".to_string())));
                }
            };

            
            if let Err(e) = startup::startup_checks(&local_app_data_path) {
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
                local_appdata_path: Some(local_app_data_path), 
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
