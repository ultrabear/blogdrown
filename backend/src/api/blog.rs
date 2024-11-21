use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    routing::{get, post, put},
    Json, Router,
};
use ulid::Ulid;
use uuid::Uuid;

use crate::{
    api::{Created, Error, GetComment, MinUser},
    auth::RequireLogin,
    bounded::BoundString,
    BlogDrownState,
};

use super::{ApiError, ApiJson, GetPost, GetPostRes, NewBlogPost, NewBlogPostRes, UpdateBlogPost};

fn title_normalize(s: &str) -> String {
    s.to_lowercase().replace(' ', "_")
}

fn expect_uuid(s: &str) -> Ulid {
    Ulid::from(s.parse::<Uuid>().expect("Database stores uuid"))
}

async fn create_post(
    auth: RequireLogin,
    State(state): State<BlogDrownState>,
    ApiJson(post): ApiJson<NewBlogPost>,
) -> Result<Created<Json<NewBlogPostRes>>, ApiError> {
    use crate::prisma::{blog_post, user};

    let id = Uuid::now_v7();
    let norm = title_normalize(&post.title);

    let post_head = state
        .prisma
        .blog_post()
        .create(
            id.to_string(),
            post.title.into_inner(),
            norm.clone(),
            user::UniqueWhereParam::IdEquals(auth.uuid()),
            vec![],
        )
        .exec()
        .await
        .map_err(Error::from_query)?;

    state
        .prisma
        .blog_post_version()
        .create(
            blog_post::UniqueWhereParam::IdEquals(post_head.id),
            post.body.into_inner(),
            vec![],
        )
        .exec()
        .await
        .map_err(Error::from_query)?;

    Ok(Created::json(NewBlogPostRes {
        id: Ulid::from(id),
        title_norm: norm,
        created_at: post_head.created_at,
    }))
}

async fn get_post(
    State(state): State<BlogDrownState>,
    Query(post): Query<GetPost>,
) -> Result<Json<GetPostRes>, ApiError> {
    use crate::prisma::{
        blog_post::{self, select},
        blog_post_version,
    };
    use prisma_client_rust::Direction;

    let post_id = post.id;

    let mut post = state
        .prisma
        .blog_post()
        .find_unique(blog_post::id::equals(Uuid::from(post_id).to_string()))
        .select(select!({
            versions(vec![])
                .order_by(blog_post_version::created_at::order(Direction::Desc))
                .take(1): select { text created_at }
            owner: select { id username }
            comments: include { author }
            title_norm
            title
            created_at
        }))
        .exec()
        .await
        .map_err(Error::from_query)?
        .ok_or_else(Error::not_found)?;

    let Some(latest) = post.versions.pop() else {
        tracing::warn!(
            "Database integrity: BlogPost({}) exists but has no version history",
            post_id
        );

        return Err(Error::not_found());
    };

    Ok(Json(GetPostRes {
        id: post_id,
        title: BoundString::new_unchecked(post.title),
        title_norm: post.title_norm,
        created_at: post.created_at,
        updated_at: latest.created_at,
        body: BoundString::new_unchecked(latest.text),
        user: MinUser {
            id: Ulid::from(post.owner.id.parse::<Uuid>().expect("database stores uuid")),
            username: BoundString::new_unchecked(post.owner.username),
        },
        comments: post.comments.into_iter().map(|c| GetComment {
            id: expect_uuid(&c.id),
            post_id,
            body: c.text,
            author: MinUser {
                id: expect_uuid(&c.author.id),
                username: BoundString::new_unchecked(c.author.username),
        
            },
            created_at: c.created_at,
            updated_at: c.updated_at,
        }).collect(),
    }))
}

async fn update_post(
    auth: RequireLogin,
    Path(post_id): Path<Ulid>,
    State(state): State<BlogDrownState>,
    ApiJson(update): ApiJson<UpdateBlogPost>,
) -> Result<(), ApiError> {
    use crate::prisma::blog_post::{self, select};

    let post_id = Uuid::from(post_id).to_string();

    let post_head = state
        .prisma
        .blog_post()
        .find_unique(blog_post::id::equals(post_id.clone()))
        .select(select!({ owner_id }))
        .exec()
        .await
        .map_err(Error::from_query)?
        .ok_or_else(Error::not_found)?;

    let owner_id = Ulid::from(
        post_head
            .owner_id
            .parse::<Uuid>()
            .expect("database stores uuid"),
    );

    let true = owner_id == auth.id else {
        return Err((
            StatusCode::FORBIDDEN,
            Json(Error::new("User lacks permission to edit blogpost")),
        ));
    };

    state
        .prisma
        .blog_post_version()
        .create(
            blog_post::id::equals(post_id),
            update.body.into_inner(),
            vec![],
        )
        .exec()
        .await
        .map_err(Error::from_query)?;

    Ok(())
}

async fn delete_post(
    auth: RequireLogin,
    Path(post_id): Path<Ulid>,
    State(state): State<BlogDrownState>,
) -> Result<(), ApiError> {
    use crate::prisma::blog_post::{self, select};

    let post_head = state
        .prisma
        .blog_post()
        .find_unique(blog_post::id::equals(Uuid::from(post_id).to_string()))
        .select(select!({ owner_id }))
        .exec()
        .await
        .map_err(Error::from_query)?
        .ok_or_else(Error::not_found)?;

    let owner_id = post_head
        .owner_id
        .parse::<Uuid>()
        .expect("Database stores uuid");

    if Ulid::from(owner_id) != auth.id {
        return Err((
            StatusCode::FORBIDDEN,
            Json(Error::new(
                "You do not have permission to delete this blogpost",
            )),
        ));
    }

    state
        .prisma
        .blog_post()
        .delete(blog_post::id::equals(Uuid::from(post_id).to_string()))
        .exec()
        .await
        .map_err(Error::from_query)?;

    Ok(())
}

pub fn routes() -> Router<BlogDrownState> {
    Router::new()
        .route("/", post(create_post))
        .route("/:post_id", put(update_post).delete(delete_post))
        .route("/one", get(get_post))
}
