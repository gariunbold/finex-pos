// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde_json::Value;

#[tauri::command]
async fn http_post(url: String, body: String) -> Result<String, String> {
    let client = reqwest::Client::new();
    let response = client
        .post(&url)
        .header("Content-Type", "application/json")
        .body(body)
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let text = response
        .text()
        .await
        .map_err(|e| format!("Read body failed: {}", e))?;

    let _: Value = serde_json::from_str(&text)
        .map_err(|_| format!("Invalid JSON response: {}", text))?;

    Ok(text)
}

#[tauri::command]
async fn http_get(url: String, auth_token: Option<String>) -> Result<String, String> {
    let client = reqwest::Client::new();
    let mut req = client
        .get(&url)
        .header("User-Agent", "FinEx-POS-Updater");

    if let Some(token) = auth_token {
        req = req.header("Authorization", format!("Bearer {}", token));
    }

    let response = req
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;

    let text = response
        .text()
        .await
        .map_err(|e| format!("Read body failed: {}", e))?;

    Ok(text)
}

#[tauri::command]
async fn download_file(url: String, auth_token: Option<String>, dest_path: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let mut req = client
        .get(&url)
        .header("User-Agent", "FinEx-POS-Updater")
        .header("Accept", "application/octet-stream");

    if let Some(token) = auth_token {
        req = req.header("Authorization", format!("Bearer {}", token));
    }

    let response = req
        .send()
        .await
        .map_err(|e| format!("Download failed: {}", e))?;

    let bytes = response
        .bytes()
        .await
        .map_err(|e| format!("Read bytes failed: {}", e))?;

    std::fs::write(&dest_path, &bytes)
        .map_err(|e| format!("Write file failed: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn run_installer(path: String) -> Result<(), String> {
    std::process::Command::new(&path)
        .arg("/S")  // NSIS silent install
        .spawn()
        .map_err(|e| format!("Failed to run installer: {}", e))?;

    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![http_post, http_get, download_file, run_installer])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
