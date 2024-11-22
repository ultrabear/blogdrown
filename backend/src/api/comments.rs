use axum::{
    extract::{Path, State},
    http::StatusCode,
    routing::put,
    Json, Router,
};
use ulid::Ulid;
use uuid::Uuid;

use crate::{api::Error, auth::RequireLogin, BlogDrownState};

use super::{ApiError, ApiJson, PostComment, Updated};

async fn update_comment(
    auth: RequireLogin,
    State(state): State<BlogDrownState>,
    Path(comment_id): Path<Ulid>,
    ApiJson(edit): ApiJson<PostComment>,
) -> Result<Json<Updated>, ApiError> {
    use crate::prisma::comment::{self, select};

    let tx = state
        .prisma
        ._transaction()
        .begin()
        .await
        .map_err(Error::from_query)?;

    let comment =
        tx.1.comment()
            .find_unique(comment::id::equals(Uuid::from(comment_id).to_string()))
            .select(select!({ author_id }))
            .exec()
            .await
            .map_err(Error::from_query)?
            .ok_or_else(Error::not_found)?;

    let author_id = Ulid::from(
        comment
            .author_id
            .parse::<Uuid>()
            .expect("database schema is uuid"),
    );

    let true = author_id == auth.id else {
        tx.0.rollback(tx.1).await.map_err(Error::from_query)?;
        return Err((
            StatusCode::FORBIDDEN,
            Json(Error::new(
                "You do not have permission to edit this comment",
            )),
        ));
    };

    let comment =
        tx.1.comment()
            .update(
                comment::id::equals(Uuid::from(comment_id).to_string()),
                vec![comment::text::set(edit.body)],
            )
            .select(select!({ updated_at }))
            .exec()
            .await
            .map_err(Error::from_query)?;

    tx.0.commit(tx.1).await.map_err(Error::from_query)?;

    Ok(Json(Updated {
        updated_at: comment.updated_at,
    }))
}

async fn delete_comment(
    auth: RequireLogin,
    Path(comment_id): Path<Ulid>,
    State(state): State<BlogDrownState>,
) -> Result<(), ApiError> {
    use crate::prisma::comment::{self, select};

    let tx = state
        .prisma
        ._transaction()
        .begin()
        .await
        .map_err(Error::from_query)?;

    let comment =
        tx.1.comment()
            .find_unique(comment::id::equals(Uuid::from(comment_id).to_string()))
            .select(select!({ author_id }))
            .exec()
            .await
            .map_err(Error::from_query)?
            .ok_or_else(Error::not_found)?;

    let author_id = Ulid::from(
        comment
            .author_id
            .parse::<Uuid>()
            .expect("database schema is uuid"),
    );

    let true = author_id == auth.id else {
        tx.0.rollback(tx.1).await.map_err(Error::from_query)?;
        return Err((
            StatusCode::FORBIDDEN,
            Json(Error::new(
                "You do not have permission to delete this comment",
            )),
        ));
    };

    tx.1.comment()
        .delete_many(vec![comment::id::equals(
            Uuid::from(comment_id).to_string(),
        )])
        .exec()
        .await
        .map_err(Error::from_query)?;

    tx.0.commit(tx.1).await.map_err(Error::from_query)?;

    Ok(())
}

pub fn routes() -> Router<BlogDrownState> {
    Router::new().route("/:commentId", put(update_comment).delete(delete_comment))
}
