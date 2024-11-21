#![allow(dead_code)]

use core::error;
use std::{env, sync::Arc};

use hmac::{Hmac, Mac};
use sha2::Sha384;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::{DefaultOnRequest, TraceLayer},
};
use tracing::Level;

#[allow(unused, warnings)]
mod prisma;

mod api;
mod auth;
mod bounded;

#[derive(Clone, Debug)]
struct BlogDrownState {
    prisma: Arc<PrismaClient>,
    jwt_secret: Hmac<Sha384>,
}

use axum::http::Method;
use axum::Router;
use prisma::PrismaClient;

#[tokio::main]
async fn main() -> Result<(), Box<dyn error::Error>> {
    tracing_subscriber::fmt::init();

    let client = PrismaClient::_builder().build().await?;

    let state = BlogDrownState {
        prisma: Arc::new(client),
        jwt_secret: Hmac::new_from_slice(
            env::var("SECRET_KEY")
                .map_err(|_| "missing SECRET_KEY")?
                .as_bytes(),
        )?,
    };

    let port = env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or_else(|| {
            tracing::info!("defaulting to port 5000 as none was set");
            5000u16
        });

    let listener = tokio::net::TcpListener::bind(("::", port))
        .await
        .map_err(|_| format!("Failed to bind port {port}"))?;

    let routes = Router::new()
        .nest("/api", api::api_routes())
        .with_state(state)
        .layer(
            CorsLayer::new()
                .allow_methods([Method::GET, Method::POST, Method::PUT])
                .allow_origin(Any),
        )
        .layer(TraceLayer::new_for_http().on_request(DefaultOnRequest::new().level(Level::INFO)));

    axum::serve(listener, routes).await?;

    Ok(())
}
