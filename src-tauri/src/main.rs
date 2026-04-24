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

// ═══════════════════════════════════════════════════════════
//  THERMAL PRINTER (raw ESC/POS bytes)
// ═══════════════════════════════════════════════════════════

#[derive(serde::Serialize)]
struct PrinterInfo {
    name: String,
    is_default: bool,
}

#[tauri::command]
async fn list_printers() -> Result<Vec<PrinterInfo>, String> {
    let printers = printers::get_printers();
    Ok(printers
        .into_iter()
        .map(|p| PrinterInfo {
            is_default: p.is_default,
            name: p.name,
        })
        .collect())
}

#[tauri::command]
async fn get_default_printer_name() -> Result<Option<String>, String> {
    let p = printers::get_default_printer();
    Ok(p.map(|x| x.name))
}

#[tauri::command]
async fn print_raw_to_printer(printer_name: Option<String>, bytes: Vec<u8>) -> Result<(), String> {
    // Тодорхой нэр өгсөн бол түүгээр; үгүй бол default
    let printer = match printer_name {
        Some(n) if !n.trim().is_empty() => printers::get_printer_by_name(&n)
            .ok_or_else(|| format!("Принтер олдсонгүй: {}", n))?,
        _ => printers::get_default_printer()
            .ok_or_else(|| "Системд default принтер тохируулагдаагүй байна".to_string())?,
    };

    let opts = printers::common::base::job::PrinterJobOptions {
        name: Some("Finex POS Receipt"),
        raw_properties: &[],
        converter: printers::common::converters::Converter::None,
    };

    printer
        .print(&bytes, opts)
        .map_err(|e| format!("Хэвлэхэд алдаа гарлаа: {:?}", e))?;

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
        .invoke_handler(tauri::generate_handler![
            http_post,
            http_get,
            download_file,
            run_installer,
            list_printers,
            get_default_printer_name,
            print_raw_to_printer
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
