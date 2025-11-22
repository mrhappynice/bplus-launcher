use serde::{Deserialize, Serialize};
use std::sync::{Arc, Mutex};
use uuid::Uuid;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct App {
    #[serde(default = "Uuid::new_v4")]
    pub id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub command: String,
    pub url: String,
}

#[derive(Clone)]
pub struct AppState {
    // Using Mutex for thread-safe access to the list
    pub apps: Arc<Mutex<Vec<App>>>,
    pub file_path: String,
}

impl AppState {
    pub fn new(file_path: &str) -> Self {
        let apps = match std::fs::read_to_string(file_path) {
            Ok(content) => serde_json::from_str(&content).unwrap_or_default(),
            Err(_) => Vec::new(), // Start empty if file doesn't exist
        };

        Self {
            apps: Arc::new(Mutex::new(apps)),
            file_path: file_path.to_string(),
        }
    }

    pub fn save(&self) {
        let apps = self.apps.lock().unwrap();
        let content = serde_json::to_string_pretty(&*apps).unwrap();
        if let Err(e) = std::fs::write(&self.file_path, content) {
            eprintln!("Failed to save apps: {}", e);
        }
    }
}