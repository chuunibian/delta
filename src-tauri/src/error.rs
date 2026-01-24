use thiserror::Error;

#[derive(Debug, Error)]
enum AppError {
    #[error("Rustqlite error: {0}")]
    RustqliteError(#[from] rusqlite::Error),

    #[error("File system error: {0}")]
    FileSystemError(#[from] std::io::Error),

    #[error("General error: {0}")]
    GeneralLogicalErr(String),

    #[error("Database error: {0}")]
    DatabaseGeneralErr(String),

    #[error("Custom error: {0}")]
    CustomError(String), // this is custom error so no #from thus need to manuallyy throw instead of ussing ?
}

// Obj for error sent to frontend
pub struct BackendError {
    pub generic_error_string: String,
    pub err_code: u32,
}

// need manual serde impl for AppError enum for sending frontend the error
// impl serde::Serialize for AppError
