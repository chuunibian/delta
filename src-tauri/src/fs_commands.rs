use crate::{
    error::AppError,
    model::{self, BackendState},
};

#[tauri::command]
pub async fn get_snapshot_storage_path(
    state: tauri::State<'_, BackendState>,
) -> Result<String, AppError> {
    let temp_data_db_path = state
        .local_appdata_path
        .as_ref()
        .unwrap()
        .join("tempsnapshot");
    return Ok(temp_data_db_path.to_string_lossy().to_string());
}
