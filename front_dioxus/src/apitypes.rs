use std::collections::HashMap;

use chrono::{DateTime, FixedOffset};
use secrecy::SecretString;
use serde_derive::{Deserialize, Serialize};
use ulid::Ulid;

#[derive(Serialize, Deserialize, Default, Debug)]
pub struct Error {
    pub message: String,
    pub errors: HashMap<String, String>,
}

pub enum RequestTransportError {
    Api(ApiError),
    RequestError(gloo_net::Error),
    ParseError(gloo_net::Error),
}

pub type ApiError = Error;

// Auth
type Username = String;
type Email = String;

#[derive(Deserialize, Serialize, Debug, Clone)]
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

#[derive(Deserialize, Clone)]
pub struct Signup {
    pub email: Email,
    pub username: Username,
    pub password: SecretString,
}

// Posts / Comments
#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct IdAndTimestamps {
    id: Ulid,
    created_at: DateTime<FixedOffset>,
    updated_at: DateTime<FixedOffset>,
}

type BlogPostBody = String;
type BlogPostTitle = String;

#[derive(Deserialize, Clone)]
pub struct NewBlogPost {
    title: BlogPostTitle,
    body: BlogPostBody,
}

#[derive(Serialize, Clone)]
pub struct NewBlogPostRes {
    #[serde(flatten)]
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

#[derive(Serialize, Deserialize, Debug, Clone)]
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
    body: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct GetComment {
    #[serde(flatten)]
    id_ts: IdAndTimestamps,
    post_id: Ulid,
    author: MinUser,
    body: String,
}

#[derive(Serialize)]
pub struct Updated {
    updated_at: DateTime<FixedOffset>,
}

#[derive(Serialize)]
pub struct FollowList {
    users: Vec<MinUser>,
}

const API_BASE: &str = "/api/v1";

async fn jpost<T: serde::Serialize, R: serde::de::DeserializeOwned>(
    route: &str,
    body: &T,
) -> Result<R, RequestTransportError> {
    let res = gloo_net::http::Request::post(&format!("{API_BASE}{route}"))
        .json(body)
        .expect("valid request")
        .send()
        .await;

    let res = res.map_err(|e| RequestTransportError::RequestError(e))?;

    if (200..=299).contains(&res.status()) {
        let json = res
            .json()
            .await
            .map_err(|e| RequestTransportError::ParseError(e))?;
        Ok(json)
    } else {
        let json = res
            .json()
            .await
            .map_err(|e| RequestTransportError::ParseError(e))?;
        Err(RequestTransportError::Api(json))
    }
}

pub mod auth {
    use super::{ApiError, AuthUser, Login};

    pub async fn login(login: Login) -> Result<AuthUser, ApiError> {
        todo!()
    }
}

pub mod blogs {
    use ulid::Ulid;

    use super::{ApiError, GetPostRes, API_BASE};

    pub async fn get_one(blogId: Ulid) -> Result<GetPostRes, ApiError> {
        let req = gloo_net::http::Request::get(&format!("{API_BASE}/blogs/one?id={blogId}"))
            .send()
            .await
            .expect("request send please work");

        if (200..=299).contains(&req.status()) {
            Ok(req.json().await.unwrap())
        } else {
            Err(req.json().await.unwrap())
        }
    }
}
