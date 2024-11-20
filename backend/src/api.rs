use std::collections::HashMap;

use crate::{auth, BlogDrownState};
use chrono::{DateTime, FixedOffset, Utc};
use prisma_client_rust::{
    prisma_errors::query_engine::{RecordNotFound, UniqueKeyViolation},
    QueryError,
};
use secrecy::SecretString;
use serde_derive::{Deserialize, Serialize};

use axum::{http::StatusCode, response::IntoResponse, routing::get, Json, Router};

async fn get_ok() -> impl IntoResponse {
    "GET ok"
}

async fn post_ok() -> impl IntoResponse {
    "POST ok"
}

#[derive(Serialize, Default)]
pub struct Error {
    pub message: String,
    pub errors: HashMap<String, String>,
}

pub type ApiError = (StatusCode, Json<Error>);

impl Error {

    pub fn new(msg: impl Into<String>) -> Self {
        Self { message: msg.into(), errors: HashMap::default() }
    }

    pub fn add(&mut self, key: impl Into<String>, value: impl Into<String>) {
        self.errors.insert(key.into(), value.into());
    }

    pub fn from_query(e: QueryError) -> ApiError {
        let mut out = Self::new("Prisma Validation Error");

        if e.is_prisma_error::<UniqueKeyViolation>() {
            out.add("unique", "Unique Constraint violated");
        } else if e.is_prisma_error::<RecordNotFound>() {
            out.add("notfound", "Record Not Found in database");
        }

        (StatusCode::INTERNAL_SERVER_ERROR, Json(out))
    }

    pub fn not_found() -> ApiError {
        (
            StatusCode::NOT_FOUND,
            Json(Self::new("Not Found")),
        )
    }
}

#[derive(Deserialize, Serialize)]
pub struct MinUser {
    pub id: ulid::Ulid,
    pub username: String,
}

#[derive(Deserialize, Serialize)]
pub struct AuthUser {
    #[serde(flatten)]
    pub min: MinUser,
    pub email: String,
    pub created_at: DateTime<FixedOffset>,
}

#[derive(Deserialize)]
pub struct Login {
    pub email: String,
    pub password: SecretString,
}

#[derive(Deserialize)]
pub struct Signup {
    pub email: String,
    pub username: String,
    pub password: SecretString,
}

pub fn api_routes() -> Router<BlogDrownState> {
    Router::new()
        .route("/", get(get_ok).post(post_ok))
        .nest("/auth", auth::routes())
}
