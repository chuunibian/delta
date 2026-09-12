use crate::{
    error::AppError,
    model::BackendState,
};

#[tauri::command]
pub async fn get_snapshot_storage_path(
    state: tauri::State<'_, BackendState>,
) -> Result<String, AppError> {
    // Reliability fix: avoid panic and return a typed startup error when state is incomplete.
    let temp_data_db_path = state
        .snapshot_storage_root
        .as_ref()
        .ok_or_else(|| {
            AppError::StartupError("Snapshot storage root is unavailable in backend state".to_string())
        })?
        .join("tempsnapshot");
    return Ok(temp_data_db_path.to_string_lossy().to_string());
}
