use serde::{Deserialize, Serialize};
use std::num::ParseIntError;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    // lib errors
    #[error("Rustqlite error: {0}")]
    RustqliteError(#[from] rusqlite::Error),

    #[error("File system error: {0}")]
    FileSystemError(#[from] std::io::Error),

    #[error("Date parse error: {0}")]
    ChronoError(#[from] chrono::ParseError),

    #[error("Date parse int error: {0}")]
    ParseIntError(#[from] ParseIntError),

    #[error("Tauri error: {0}")]
    TauriError(#[from] tauri::Error),

    // Manual errs
    #[error("General error: {0}")]
    GeneralLogicalErr(String),

    #[error("Database error: {0}")]
    DatabaseGeneralErr(String),

    #[error("App startup error: {0}")]
    StartupError(String),

    #[error("Custom error: {0}")]
    CustomError(String), // this is custom error so no #from thus need to manuallyy throw instead of ussing ?
}

// Obj for error sent to frontend
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct BackendError {
    pub user_error_string_desc: String,
    pub library_generated_error_desc: String,
    pub err_code: u32,
}

impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::ser::Serializer,
    {
        let resp = match self {
            AppError::GeneralLogicalErr(str) => BackendError {
                user_error_string_desc: str.to_string(),
                library_generated_error_desc: "N/A".to_string(),
                err_code: 1,
            },
            AppError::RustqliteError(e) => BackendError {
                user_error_string_desc: "N/A".to_string(),
                library_generated_error_desc: e.to_string(),
                err_code: 2,
            },
            AppError::FileSystemError(e) => BackendError {
                user_error_string_desc: "N/A".to_string(),
                library_generated_error_desc: e.to_string(),
                err_code: 3,
            },
            AppError::StartupError(str) => BackendError {
                user_error_string_desc: str.to_string(),
                library_generated_error_desc: "N/A".to_string(),
                err_code: 4,
            },
            AppError::CustomError(str) => BackendError {
                user_error_string_desc: str.to_string(),
                library_generated_error_desc: "N/A".to_string(),
                err_code: 5,
            },
            AppError::DatabaseGeneralErr(str) => BackendError {
                user_error_string_desc: str.to_string(),
                library_generated_error_desc: "N/A".to_string(),
                err_code: 6,
            },
            AppError::ChronoError(e) => BackendError {
                user_error_string_desc: "N/A".to_string(),
                library_generated_error_desc: e.to_string(),
                err_code: 7,
            },
            AppError::ParseIntError(e) => BackendError {
                user_error_string_desc: "N/A".to_string(),
                library_generated_error_desc: e.to_string(),
                err_code: 8,
            },
            AppError::TauriError(e) => BackendError {
                user_error_string_desc: "N/A".to_string(),
                library_generated_error_desc: e.to_string(),
                err_code: 9,
            },
        };

        return resp.serialize(serializer);
    }
}
