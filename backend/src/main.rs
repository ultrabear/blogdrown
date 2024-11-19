#![allow(dead_code)]

use core::error;
use std::{
    env,
    sync::{Arc, Mutex},
};

use axum_csrf::{CsrfConfig, CsrfLayer, CsrfToken};
use axum_extra::extract::CookieJar;
use tower_http::{
    cors::{Any, CorsLayer},
    trace::{DefaultOnRequest, TraceLayer},
};
use tracing::Level;

#[allow(unused, warnings)]
mod prisma;

mod api;
mod auth;

#[derive(Clone, Debug)]
struct BlogDrownState {
    prisma: Arc<Mutex<PrismaClient>>,
}

use axum::{
    extract::Request,
    http::{Method, StatusCode},
    middleware::Next,
    response::IntoResponse,
};
use axum::{http::header::SET_COOKIE, response::AppendHeaders, Router};
use prisma::PrismaClient;

async fn csrf_handle(
    token: CsrfToken,
    cookies: CookieJar,
    method: Method,
    request: Request,
    next: Next,
) -> impl IntoResponse {
    if method == Method::POST || method == Method::PUT {
        let Ok(_) = cookies
            .get("_csrf")
            .ok_or("CSRF")
            .and_then(|s| token.verify(s.value()).map_err(|_| "CSRF"))
        else {
            return (StatusCode::FORBIDDEN, "CSRF Token invalid").into_response();
        };
    }

    let cookie = format!(
        "_csrf={}; SameSite=Lax; HttpOnly; Path=/; Expires={}",
        token.authenticity_token().unwrap(),
        (chrono::Utc::now() + chrono::Duration::hours(6)).to_rfc2822()
    );

    (
        token,
        AppendHeaders([(SET_COOKIE, cookie)]),
        next.run(request).await,
    )
        .into_response()
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn error::Error>> {
    tracing_subscriber::fmt::init();

    let client = PrismaClient::_builder().build().await?;

    let state = BlogDrownState {
        prisma: Arc::new(Mutex::new(client)),
    };

    let port = env::var("PORT")
        .ok()
        .and_then(|s| s.parse().ok())
        .unwrap_or(5000u16);

    let csrf = CsrfConfig::default()
        .with_key(Some(axum_csrf::Key::from(
            env::var("SECRET_KEY")
                .map_err(|_| "missing SECRET_KEY")?
                .as_bytes(),
        )))
        .with_salt("blogdrown");

    let listener = tokio::net::TcpListener::bind(("0.0.0.0", port))
        .await
        .map_err(|_| format!("Failed to bind port {port}"))?;

    let routes = Router::new()
        .nest("/api", api::api_routes())
        .with_state(state)
        .layer(axum::middleware::from_fn(csrf_handle))
        .layer(CsrfLayer::new(csrf))
        .layer(
            CorsLayer::new()
                .allow_methods([Method::GET, Method::POST])
                .allow_origin(Any),
        )
        .layer(TraceLayer::new_for_http().on_request(DefaultOnRequest::new().level(Level::INFO)));

    axum::serve(listener, routes).await?;

    Ok(())
}
