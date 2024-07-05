use tauri::api::process::{Command, CommandEvent};

use crate::models::file::{FileResponse, StringError};

#[tauri::command]
pub async fn handle_file_input_async(filepath: String, filename: String, handle: tauri::AppHandle ) -> Result<FileResponse, String> {
    let response = create_input_csv(filepath, filename, handle)
      .await
      .map_err(|err| err.details)?;
    return Ok(response);
}

#[tauri::command]
pub async fn setup_preview_async(filepath: String, start: String, len: String, handle: tauri::AppHandle) -> Result<String, String> {
    let response = make_preview_path(filepath, start, len, handle)
      .await
      .map_err(|err| err.details)?;
    return Ok(response);
}

#[tauri::command]
pub async fn get_rows_async(handle: tauri::AppHandle) -> Result<String, String> {
    let response = get_rows(handle)
      .await
      .map_err(|err| err.details)?;
    return Ok(response);
}

#[tauri::command]
pub async fn get_accession_versions_async(accession_index: String, handle: tauri::AppHandle) -> Result<String, String> {
    let response = get_columns(accession_index, handle)
      .await
      .map_err(|err| err.details)?;
    return Ok(response);
}

// GET THE EACH ROW FROM AN ENTIRE COLUMN, USED TO GET THE ACCESSION VERSIONS OF SELECTED COLUMN
async fn get_columns(accession_index: String, handle: tauri::AppHandle) -> Result<String, StringError> {
  let app_dir = handle.path_resolver().app_local_data_dir().unwrap();
  let csv_path = app_dir.join("input.csv").display().to_string();

  let (mut rx, _child) = Command::new_sidecar("qsv")?
    .args([ "select", &accession_index, "-n", &csv_path ])
    .spawn()?;

  let result = tauri::async_runtime::spawn(async move {
    let mut csv_string = String::new();
    while let Some(event) = rx.recv().await {
        if let CommandEvent::Error(_line) = event {
          return Err(StringError::new("Error getting the .".to_string()));
        } else if let CommandEvent::Stdout(line) = event {
          let new_row = "\n".to_string() + &line;
          csv_string.push_str(&new_row);
        }
    }
    Ok(csv_string)
  }).await?;

  return match result {
      Ok(json_string) => Ok(json_string),
      Err(e) => Err(e),
  };
}

// MAKE THE PREVIEW CSV FILE
async fn make_preview_path(filepath: String, start: String, len: String, handle: tauri::AppHandle ) -> Result<String, StringError> {  
  let app_dir = handle.path_resolver().app_local_data_dir().unwrap();
  let temp_csv_path = app_dir.join("temp.csv").display().to_string();
  
  let (mut rx, _child) = Command::new_sidecar("qsv")?
    .args([ "slice", "--start", &start, "--len", &len, "--output", &temp_csv_path, &filepath ])
    .spawn()?;

  let result = tauri::async_runtime::spawn(async move {
    while let Some(event) = rx.recv().await {
        if let CommandEvent::Error(_line) = event {
          return Err(StringError::new("Error slicing csv file.".to_string()));
        } else if let CommandEvent::Stderr(line) = event {
            if line.to_ascii_lowercase().contains("error") {
              return Err(StringError::new("Error slicing csv file.".to_string()));
            }
        }
    }
    Ok(())
  }).await?;

  return match result {
      Ok(_) => Ok(temp_csv_path),
      Err(e) => Err(e),
  };
}

// GET THE ROWS FROM THE LOCAL CSV FILE
async fn get_rows(handle: tauri::AppHandle ) -> Result<String, StringError> {  
  let app_dir = handle.path_resolver().app_local_data_dir().unwrap();
  let temp_csv_path = app_dir.join("temp.csv").display().to_string();

  let (mut rx, _child) = Command::new_sidecar("qsv")?
    .args([ "tojsonl", &temp_csv_path ])
    .spawn()?;

  let result = tauri::async_runtime::spawn(async move {
    let mut json_string = String::new();
    while let Some(event) = rx.recv().await {
        if let CommandEvent::Error(_line) = event {
          return Err(StringError::new("Error creating JSON from temp CSV file.".to_string()));
        } else if let CommandEvent::Stdout(line) = event {
          if json_string.is_empty() {
            json_string.push_str(&line);
          } else {
            let new_row = "\n".to_string() + &line;
            json_string.push_str(&new_row);
          }
        }
    }
    Ok(json_string)
  }).await?;

  return match result {
      Ok(json_string) => Ok(json_string),
      Err(e) => Err(e),
  };
}

// PARSE THE SPREADSHEET INTO A LOCAL CSV FILE WITH ALL THE ROW DATA
async fn create_input_csv(filepath: String, filename: String, handle: tauri::AppHandle) -> Result<FileResponse, StringError> {
  let app_dir = handle.path_resolver().app_local_data_dir().unwrap();
  let csv_path = app_dir.join("input.csv").display().to_string();

  let (mut rx, _child) = Command::new_sidecar("qsv")?
      .args([ "excel", &filepath, "--output", &csv_path, "--sheet", "0", "--flexible", "--trim" ])
      .spawn()?;

  let result = tauri::async_runtime::spawn(async move {
      Ok(while let Some(event) = rx.recv().await {
          if let CommandEvent::Error(_line) = event {
            return Err(StringError::new("Error parsing the excel file.".to_string()));
          } else if let CommandEvent::Stderr(line) = event {
            if line.to_ascii_lowercase().contains("error") {
              return Err(StringError::new("Error parsing the excel file.".to_string()));
            }
          }
      })
  }).await?;

  return match result {
      Ok(_) => Ok(FileResponse { name: filename, path: csv_path }),
      Err(e) => Err(e),
  };
}
