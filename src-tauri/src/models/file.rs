use std::fmt;
use std::error::Error;
use serde::{Deserialize, Serialize};

// File structure
#[derive(Debug, Serialize, Deserialize)]
pub struct FileResponse {
    pub name: String,
    pub path: String,
}

#[derive(Debug)]
pub struct StringError {
  pub details: String
}

impl StringError {
  pub fn new(msg: String) -> StringError {
    StringError{details: msg}
  }
}

impl fmt::Display for StringError {
  fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
    write!(f, "{}", self.details)
  }
}

impl Error for StringError {
  fn description(&self) -> &str {
      &self.details
  }
}

impl From<tauri::api::Error> for StringError {
    fn from(e: tauri::api::Error) -> Self {
      StringError::new(format!("{e}"))
    }
  }
  
impl From<tauri::Error> for StringError {
  fn from(e: tauri::Error) -> Self {
    StringError::new(format!("{e}"))
  }
}