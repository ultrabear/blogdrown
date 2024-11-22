use std::collections::HashMap;

use crate::{auth, bounded::BoundString, BlogDrownState};
use chrono::{DateTime, FixedOffset};
use prisma_client_rust::{
    prisma_errors::query_engine::{RecordNotFound, UniqueKeyViolation},
    QueryError,
};
use secrecy::SecretString;
use serde_derive::{Deserialize, Serialize};

use axum::{
    async_trait,
    extract::{rejection::JsonRejection, FromRequest, Request},
    http::StatusCode,
    response::IntoResponse,
    Json, RequestExt, Router,
};
use ulid::Ulid;

mod blog;
mod comments;

#[derive(Serialize, Default)]
pub struct Error {
    pub message: String,
    pub errors: HashMap<String, String>,
}

pub type ApiError = (StatusCode, Json<Error>);

impl Error {
    pub fn new(msg: impl Into<String>) -> Self {
        Self {
            message: msg.into(),
            errors: HashMap::default(),
        }
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
        (StatusCode::NOT_FOUND, Json(Self::new("Not Found")))
    }
}

pub struct Created<T>(pub T);

impl<T: serde::Serialize> Created<Json<T>> {
    pub fn json(val: T) -> Self {
        Self(Json(val))
    }
}

impl<T: IntoResponse> IntoResponse for Created<T> {
    fn into_response(self) -> axum::response::Response {
        (StatusCode::CREATED, self.0).into_response()
    }
}

pub struct ApiJson<T>(pub T);

macro_rules! tri {
    ($e:expr) => {
        (|| $e)()
    };
}

#[async_trait]
impl<T, S> FromRequest<S> for ApiJson<T>
where
    T: serde::de::DeserializeOwned + 'static,
    S: Send + Sync,
{
    type Rejection = ApiError;

    async fn from_request(req: Request, state: &S) -> Result<Self, Self::Rejection> {
        let res: Result<Json<T>, _> = req.extract_with_state(state).await;

        match res {
            Ok(Json(data)) => Ok(ApiJson(data)),
            Err(e) => {
                macro_rules! unprocess {
                    ($msg:expr) => {
                        (StatusCode::UNPROCESSABLE_ENTITY, Json(Error::new($msg)))
                    };
                }

                Err(match e {
                    JsonRejection::BytesRejection(_) => unprocess!("Body malformed, unprocessable"),
                    JsonRejection::JsonSyntaxError(_) => unprocess!("Json data in body malformed"),
                    JsonRejection::MissingJsonContentType(_) => {
                        unprocess!("Missing Content-Type header")
                    }
                    JsonRejection::JsonDataError(err) => {
                        let mut output = unprocess!("Json Data Validation Error");

                        use std::error::Error as StdError;

                        let source = tri! {
                            err.source()?
                                .source()?
                                .downcast_ref::<serde_path_to_error::Error<serde_json::Error>>()
                        };

                        if let Some(source) = source {
                            let path = source.path().to_string();
                            let err = source.inner().to_string();

                            if path != "." {
                                output.1.add(path, err);
                            } else if let Some(field) =
                                tri! { Some(err.split_once('`')?.1.split_once('`')?.0) }
                            {
                                output.1.add(field, "Field was not passed");
                            }
                        }

                        output
                    }
                    _ => unprocess!("Unknown JSON Rejection Error"),
                })
            }
        }
    }
}

// Auth
type Username = BoundString<6, 64>;
type Email = BoundString<2, 128>;

#[derive(Deserialize, Serialize)]
pub struct MinUser {
    pub id: ulid::Ulid,
    pub username: Username,
}

#[derive(Deserialize, Serialize)]
pub struct AuthUser {
    #[serde(flatten)]
    pub min: MinUser,
    pub email: Email,
    pub created_at: DateTime<FixedOffset>,
}

#[derive(Deserialize)]
pub struct Login {
    pub email: Email,
    pub password: SecretString,
}

#[derive(Deserialize)]
pub struct Signup {
    pub email: Email,
    pub username: Username,
    pub password: SecretString,
}

// Posts / Comments
#[derive(Serialize)]
pub struct IdAndTimestamps {
    id: Ulid,
    created_at: DateTime<FixedOffset>,
    updated_at: DateTime<FixedOffset>,
}

type BlogPostBody = BoundString<32, 50_000>;
type BlogPostTitle = BoundString<2, 128>;

#[derive(Deserialize)]
pub struct NewBlogPost {
    title: BlogPostTitle,
    body: BlogPostBody,
}

#[derive(Serialize)]
pub struct NewBlogPostRes {
    id_ts: IdAndTimestamps,
    title_norm: String,
}

#[derive(Deserialize, Debug)]
pub struct GetPost {
    id: Ulid,
}

#[derive(Serialize)]
pub struct GetAllPostsItem {
    #[serde(flatten)]
    id_ts: IdAndTimestamps,
    title_norm: String,
    title: String,
    partial_body: String,
    user: MinUser,
}

#[derive(Serialize)]
pub struct GetPostRes {
    #[serde(flatten)]
    id_ts: IdAndTimestamps,
    title_norm: String,
    title: BlogPostTitle,
    body: BlogPostBody,
    user: MinUser,
    comments: Vec<GetComment>,
}

#[derive(Deserialize)]
pub struct UpdateBlogPost {
    body: BlogPostBody,
}

#[derive(Deserialize)]
pub struct PostComment {
    body: BoundString<4, 2000>,
}

#[derive(Serialize)]
pub struct GetComment {
    id_ts: IdAndTimestamps,
    post_id: Ulid,
    author: MinUser,
    body: String,
}

#[derive(Serialize)]
pub struct Updated {
    updated_at: DateTime<FixedOffset>,
}

pub fn api_routes() -> Router<BlogDrownState> {
    Router::new().nest(
        "/v1",
        Router::new()
            .nest("/auth", auth::routes())
            .nest("/blogs", blog::routes())
            .nest("/comments", comments::routes()),
    )
}
