use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    // lib errors
    #[error("Rustqlite error: {0}")]
    RustqliteError(#[from] rusqlite::Error),

    #[error("File system error: {0}")]
    FileSystemError(#[from] std::io::Error),

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
pub struct BackendError {
    pub generic_error_string_desc: String,
    pub library_generated_error_desc: String,
    pub err_code: u32,
}

// the actual error is still accessible when thrown by framweorks the #error is just a friendly debug/print the error for the backend
// the {0} is actually the first (and only) item in the enum (actslike tuple) which is hte error

// need manual serde impl for AppError enum for sending frontend the error
// impl serde::Serialize for AppError
