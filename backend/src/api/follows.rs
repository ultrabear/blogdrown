use axum::{
    extract::{Path, State},
    routing::{get, post},
    Json, Router,
};
use ulid::Ulid;
use uuid::Uuid;

use crate::{
    api::{Error, MinUser},
    auth::RequireLogin,
    bounded::BoundString,
    BlogDrownState,
};

use super::{ApiError, FollowList};

async fn add_follow(
    auth: RequireLogin,
    Path(uid): Path<Ulid>,
    State(state): State<BlogDrownState>,
) -> Result<(), ApiError> {
    use crate::prisma::user;

    state
        .prisma
        .user()
        .update(
            user::id::equals(auth.uuid()),
            vec![user::following::connect(vec![user::id::equals(
                Uuid::from(uid).to_string(),
            )])],
        )
        .exec()
        .await
        .map_err(Error::from_query)?;

    Ok(())
}

async fn remove_follow(
    auth: RequireLogin,
    Path(uid): Path<Ulid>,
    State(state): State<BlogDrownState>,
) -> Result<(), ApiError> {
    use crate::prisma::user;

    state
        .prisma
        .user()
        .update(
            user::id::equals(auth.uuid()),
            vec![user::following::disconnect(vec![user::id::equals(
                Uuid::from(uid).to_string(),
            )])],
        )
        .exec()
        .await
        .map_err(Error::from_query)?;

    Ok(())
}

async fn get_follows(
    auth: RequireLogin,
    State(state): State<BlogDrownState>,
) -> Result<Json<FollowList>, ApiError> {
    use crate::prisma::user;

    let following = state
        .prisma
        .user()
        .find_unique(user::id::equals(auth.uuid()))
        .select(user::select!({ following: select { username id } }))
        .exec()
        .await
        .map_err(Error::from_query)?
        .ok_or_else(Error::not_found)?;

    Ok(Json(FollowList {
        users: following
            .following
            .into_iter()
            .map(|f| MinUser {
                id: Ulid::from(f.id.parse::<Uuid>().expect("db stores uuid")),
                username: BoundString::new_unchecked(f.username),
            })
            .collect(),
    }))
}

//async fn following_feed(auth: RequireLogin, State(state): State<BlogDrownState>) -> Result<String, ApiError> {
//    todo!()
//}

pub fn routes() -> Router<BlogDrownState> {
    Router::new()
        .route("/:userId", post(add_follow).delete(remove_follow))
        .route("/", get(get_follows))
    //.route("/feed.rss", get(following_feed))
}
