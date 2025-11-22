use axum::{
    extract::{Path, State},
    http::StatusCode,
    response::Json,
};
use std::process::Command;
use uuid::Uuid;
use serde_json::{json, Value};
use crate::model::{App, AppState};

// --- CRUD Operations ---

pub async fn list_apps(State(state): State<AppState>) -> Json<Vec<App>> {
    let apps = state.apps.lock().unwrap();
    Json(apps.clone())
}

pub async fn create_app(
    State(state): State<AppState>,
    Json(mut payload): Json<App>,
) -> Json<App> {
    // Ensure a new ID is generated if not provided (though usually handled by frontend/serde)
    if payload.id == Uuid::nil() {
        payload.id = Uuid::new_v4();
    }
    
    {
        let mut apps = state.apps.lock().unwrap();
        apps.push(payload.clone());
    } // Drop lock
    state.save();
    
    Json(payload)
}

pub async fn update_app(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
    Json(payload): Json<App>,
) -> StatusCode {
    let mut apps = state.apps.lock().unwrap();
    if let Some(app) = apps.iter_mut().find(|a| a.id == id) {
        app.name = payload.name;
        app.description = payload.description;
        app.command = payload.command;
        app.url = payload.url;
        drop(apps); // Drop lock before saving
        state.save();
        StatusCode::OK
    } else {
        StatusCode::NOT_FOUND
    }
}

pub async fn delete_app(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> StatusCode {
    let mut apps = state.apps.lock().unwrap();
    let len_before = apps.len();
    apps.retain(|a| a.id != id);
    
    if apps.len() < len_before {
        drop(apps);
        state.save();
        StatusCode::NO_CONTENT
    } else {
        StatusCode::NOT_FOUND
    }
}

// --- Command Execution ---

pub async fn launch_app(
    Path(id): Path<Uuid>,
    State(state): State<AppState>,
) -> (StatusCode, Json<Value>) { // Changed return type
    let apps = state.apps.lock().unwrap();
    
    if let Some(app) = apps.iter().find(|a| a.id == id) {
        let cmd_str = app.command.clone();
        println!("Launching: {}", cmd_str);

        #[cfg(target_os = "windows")]
        let (shell, arg) = ("cmd", "/C");
        #[cfg(not(target_os = "windows"))]
        let (shell, arg) = ("sh", "-c");

        // Use output() instead of spawn() to capture stdout/stderr
        // Note: This waits for the command to complete or detach.
        let result = Command::new(shell)
            .arg(arg)
            .arg(&cmd_str)
            .output();

        match result {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                let stderr = String::from_utf8_lossy(&output.stderr);
                
                let status_msg = if output.status.success() {
                    "Command executed successfully."
                } else {
                    "Command failed."
                };

                (
                    StatusCode::OK,
                    Json(json!({
                        "success": output.status.success(),
                        "message": status_msg,
                        "command": cmd_str,
                        "stdout": stdout,
                        "stderr": stderr
                    }))
                )
            },
            Err(e) => (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(json!({
                    "success": false,
                    "message": format!("Failed to execute process: {}", e),
                    "command": cmd_str,
                    "stdout": "",
                    "stderr": ""
                }))
            ),
        }
    } else {
        (
            StatusCode::NOT_FOUND, 
            Json(json!({ "success": false, "message": "App not found" }))
        )
    }
}
