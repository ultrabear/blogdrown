use crate::BlogDrownState;

use axum::{
    response::IntoResponse,
    routing::{get, post},
    Router,
};

async fn get_ok() -> impl IntoResponse {
    "GET ok"
}

async fn post_ok() -> impl IntoResponse {
    "POST ok"
}

pub fn api_routes() -> Router<BlogDrownState> {
    Router::new()
        .route("/", get(get_ok))
        .route("/", post(post_ok))
}
