// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use crate::invoke::*;

mod invoke;
mod models;

fn main() {
  tauri::Builder::default()
    .plugin(tauri_plugin_store::Builder::default().build())
    .invoke_handler(tauri::generate_handler![
      handle_file_input_async,
      setup_preview_async,
      get_rows_async,
      get_accession_versions_async
    ])
  .run(tauri::generate_context!())
  .expect("Error running application.");
}