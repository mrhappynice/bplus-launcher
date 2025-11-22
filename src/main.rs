mod handlers;
mod model;

use axum::{
    routing::{get, post, put, delete},
    Router,
};
use std::net::SocketAddr;
use tower_http::{services::ServeDir, trace::TraceLayer};
use model::AppState;

#[tokio::main]
async fn main() {
    // Initialize logging
    tracing_subscriber::fmt::init();

    let state = AppState::new("apps.json");

    // Define routes
    let app = Router::new()
        .route("/api/apps", get(handlers::list_apps).post(handlers::create_app))
        .route("/api/apps/:id", put(handlers::update_app).delete(handlers::delete_app))
        .route("/api/apps/:id/launch", post(handlers::launch_app))
        // Serve frontend files
        .nest_service("/", ServeDir::new("static"))
        .with_state(state)
        .layer(TraceLayer::new_for_http());

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("Server running at http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}