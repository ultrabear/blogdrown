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
    prisma::blog_post_version,
    BlogDrownState,
};

use super::{
    ApiError, ApiJson, GetAllPostsItem, GetPost, GetPostRes, IdAndTimestamps, NewBlogPost,
    NewBlogPostRes, PostComment, UpdateBlogPost, Updated,
};

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

    let latest = state
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
        id_ts: IdAndTimestamps {
            id: Ulid::from(id),
            created_at: post_head.created_at,
            updated_at: latest.created_at,
        },
        title_norm: norm,
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
        id_ts: IdAndTimestamps {
            id: post_id,
            created_at: post.created_at,
            updated_at: latest.created_at,
        },
        title: BoundString::new_unchecked(post.title),
        title_norm: post.title_norm,
        body: BoundString::new_unchecked(latest.text),
        user: MinUser {
            id: Ulid::from(post.owner.id.parse::<Uuid>().expect("database stores uuid")),
            username: BoundString::new_unchecked(post.owner.username),
        },
        comments: post
            .comments
            .into_iter()
            .map(|c| GetComment {
                id_ts: IdAndTimestamps {
                    id: expect_uuid(&c.id),
                    created_at: c.created_at,
                    updated_at: c.updated_at,
                },
                post_id,
                body: c.text,
                author: MinUser {
                    id: expect_uuid(&c.author.id),
                    username: BoundString::new_unchecked(c.author.username),
                },
            })
            .collect(),
    }))
}

async fn update_post(
    auth: RequireLogin,
    Path(post_id): Path<Ulid>,
    State(state): State<BlogDrownState>,
    ApiJson(update): ApiJson<UpdateBlogPost>,
) -> Result<Json<Updated>, ApiError> {
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

    let timestamp = state
        .prisma
        .blog_post_version()
        .create(
            blog_post::id::equals(post_id),
            update.body.into_inner(),
            vec![],
        )
        .select(blog_post_version::select!({ created_at }))
        .exec()
        .await
        .map_err(Error::from_query)?;

    Ok(Json(Updated {
        updated_at: timestamp.created_at,
    }))
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

async fn new_comment(
    auth: RequireLogin,
    Path(post_id): Path<Ulid>,
    State(state): State<BlogDrownState>,
    ApiJson(comment): ApiJson<PostComment>,
) -> Result<Json<IdAndTimestamps>, ApiError> {
    use crate::prisma::{blog_post, comment, user};

    let id = Uuid::from(post_id);

    let post = state
        .prisma
        .blog_post()
        .find_unique(blog_post::id::equals(id.to_string()))
        .exec()
        .await
        .map_err(Error::from_query)?
        .ok_or_else(Error::not_found)?;

    let id = Uuid::now_v7();

    let comment = state
        .prisma
        .comment()
        .create(
            id.to_string(),
            blog_post::id::equals(post.id),
            user::id::equals(auth.uuid()),
            comment.body.into_inner(),
            vec![],
        )
        .select(comment::select!({ created_at }))
        .exec()
        .await
        .map_err(Error::from_query)?;

    Ok(Json(IdAndTimestamps {
        id: Ulid::from(id),
        created_at: comment.created_at,
        updated_at: comment.created_at,
    }))
}

/// Copied from rust stdlib unstable(feature = "round_char_boundary")
pub fn floor_char_boundary(s: &str, index: usize) -> usize {
    if index >= s.len() {
        s.len()
    } else {
        let lower_bound = index.saturating_sub(3);
        let new_index = s.as_bytes()[lower_bound..=index]
            .iter()
            // this is bit magic equivalent to b < 128 || b >= 192
            .rposition(|b| (*b as i8) >= -0x40);

        // SAFETY: we know that the character boundary will be within four bytes
        unsafe { lower_bound + new_index.unwrap_unchecked() }
    }
}

async fn get_all_posts(
    State(state): State<BlogDrownState>,
) -> Result<Json<Vec<GetAllPostsItem>>, ApiError> {
    use crate::prisma::{blog_post, blog_post_version, user};
    use prisma_client_rust::Direction;

    let posts = state
        .prisma
        .blog_post()
        .find_many(vec![])
        .order_by(blog_post::created_at::order(Direction::Desc))
        .include(blog_post::include!({ versions(vec![]).order_by(blog_post_version::created_at::order(Direction::Desc)).take(1) owner }))
        .exec().await.map_err(Error::from_query)?;

    Ok(Json(
        posts
            .into_iter()
            .filter_map(|mut p| {
                let Some(mut latest) = p.versions.pop() else {
                    tracing::warn!(
                        "Database integrity: BlogPost({}) exists but has no version history",
                        expect_uuid(&p.id)
                    );

                    return None;
                };

                let bound = floor_char_boundary(&latest.text, 100);
                latest.text.truncate(bound);

                Some(GetAllPostsItem {
                    id_ts: IdAndTimestamps {
                        id: expect_uuid(&p.id),
                        created_at: p.created_at,
                        updated_at: latest.created_at,
                    },
                    title: p.title,
                    title_norm: p.title_norm,
                    user: MinUser {
                        id: expect_uuid(&p.owner.id),
                        username: BoundString::new_unchecked(p.owner.username),
                    },
                    partial_body: latest.text,
                })
            })
            .collect(),
    ))
}

pub fn routes() -> Router<BlogDrownState> {
    Router::new()
        .route("/", post(create_post).get(get_all_posts))
        .route("/:post_id", put(update_post).delete(delete_post))
        .route("/:post_id/comments", post(new_comment))
        .route("/one", get(get_post))
}
