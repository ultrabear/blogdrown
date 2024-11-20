use axum::{
    async_trait, debug_handler,
    extract::{FromRequestParts, State},
    http::{header::SET_COOKIE, request::Parts, StatusCode},
    response::{AppendHeaders, IntoResponse, IntoResponseParts},
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::CookieJar;
use jwt::{SignWithKey, VerifyWithKey};
use prisma_client_rust::or;
use scrypt::{
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Scrypt,
};
use secrecy::{ExposeSecret, SecretString};
use ulid::Ulid;
use uuid::Uuid;

use crate::{
    api::{ApiError, AuthUser, Error, Login, MinUser, Signup},
    prisma, BlogDrownState,
};

#[derive(serde_derive::Serialize, serde_derive::Deserialize)]
pub struct RequireLogin {
    pub id: ulid::Ulid,
}

impl RequireLogin {
    pub fn uuid(&self) -> String {
        Uuid::from(self.id).to_string()
    }
}

fn scrypt_hash(password: SecretString) -> String {
    use scrypt::Params;

    let scrypt_params = Params::new(
        Params::RECOMMENDED_LOG_N - 4,
        Params::RECOMMENDED_R + 2,
        4, // parallel
        Params::RECOMMENDED_LEN,
    )
    .expect("valid config");

    let salt = SaltString::generate(&mut rand::thread_rng());

    Scrypt
        .hash_password_customized(
            password.expose_secret().as_bytes(),
            None,
            None,
            scrypt_params,
            &salt,
        )
        .expect("Scrypt must not fail to hash password")
        .to_string()
}

fn scrypt_verify(password: SecretString, hash: String) -> Result<(), ()> {
    Scrypt
        .verify_password(
            password.expose_secret().as_bytes(),
            &PasswordHash::new(&hash).map_err(|_| ())?,
        )
        .map_err(|_| ())
        .map(|_| ())
}

#[async_trait]
impl FromRequestParts<BlogDrownState> for RequireLogin {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &BlogDrownState,
    ) -> Result<Self, Self::Rejection> {
        let reject = || {
            (
                StatusCode::UNAUTHORIZED,
                Json(Error::new("Logging in is required for this endpoint")),
            )
        };

        let Ok(jar) = CookieJar::from_request_parts(parts, state).await;

        let Some(cookie) = jar.get("session") else {
            return Err(reject());
        };

        let login: RequireLogin = cookie
            .value()
            .verify_with_key(&state.jwt_secret)
            .map_err(|_| reject())?;

        let exists = state
            .prisma
            .user()
            .find_unique(prisma::user::id::equals(login.uuid()))
            .select(prisma::user::select!({ id }))
            .exec()
            .await;

        if !exists.is_ok_and(|v| v.is_some()) {
            return Err(reject());
        }

        Ok(login)
    }
}

macro_rules! authuser {
    ($user:ident) => {
        Json(AuthUser {
            email: $user.email,
            created_at: $user.created_at,
            min: MinUser {
                id: $user.id.parse::<Uuid>().expect("schema is uuid").into(),
                username: $user.username,
            },
        })
    };
}

#[debug_handler]
async fn auth_info(
    user: RequireLogin,
    State(state): State<BlogDrownState>,
) -> Result<Json<AuthUser>, ApiError> {
    use prisma::user;

    let user = state
        .prisma
        .user()
        .find_unique(user::id::equals(user.uuid()))
        .select(user::select!({id email username created_at}))
        .exec()
        .await
        .map_err(Error::from_query)?
        .ok_or_else(Error::not_found)?;

    Ok(authuser!(user))
}

async fn signup(
    State(state): State<BlogDrownState>,
    Json(signup): Json<Signup>,
) -> Result<(impl IntoResponseParts, Json<AuthUser>), ApiError> {
    let query = state.prisma;

    use prisma::user;

    let existing = query
        .user()
        .count(vec![or![
            user::username::equals(signup.username.clone()),
            user::email::equals(signup.email.clone())
        ]])
        .exec()
        .await
        .map_err(Error::from_query)?;

    if existing != 0 {
        let username = signup.username.clone();
        let uquery = query.clone();
        let username = tokio::spawn(async move {
            uquery
                .user()
                .count(vec![user::username::equals(username)])
                .exec()
                .await
                .map_err(Error::from_query)
        });
        let equery = query.clone();
        let email = signup.email.clone();
        let email = tokio::spawn(async move {
            equery
                .user()
                .count(vec![user::email::equals(email)])
                .exec()
                .await
                .map_err(Error::from_query)
        });

        let mut err = Error::new("User Already Exists");

        if username.await.unwrap()? != 0 {
            err.add(
                "username",
                format!("Username {} already exists", signup.username),
            );
        }

        if email.await.unwrap()? != 0 {
            err.add("email", format!("Email {} already exists", signup.email));
        }

        return Err((StatusCode::BAD_REQUEST, Json(err)));
    }

    let user = query
        .user()
        .create(
            Uuid::now_v7().to_string(),
            signup.username,
            signup.email,
            scrypt_hash(signup.password),
            vec![],
        )
        .select(user::select!({id email username created_at}))
        .exec()
        .await
        .map_err(Error::from_query)?;

    let ulid_id: Ulid = user.id.parse::<Uuid>().expect("schema is uuid").into();

    let token = RequireLogin { id: ulid_id }
        .sign_with_key(&state.jwt_secret)
        .expect("RequireLogin is valid serde_json");

    Ok((
        AppendHeaders([(
            SET_COOKIE,
            format!("session={token}; HttpOnly; SameSite=Lax; Path=/"),
        )]),
        authuser!(user),
    ))
}

async fn login(
    State(state): State<BlogDrownState>,
    Json(signup): Json<Login>,
) -> Result<(impl IntoResponseParts, Json<AuthUser>), ApiError> {
    use prisma::user;

    let user = state
        .prisma
        .user()
        .find_unique(user::email::equals(signup.email.clone()))
        .exec()
        .await
        .map_err(Error::from_query)?;

    let Some(user) = user else {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(Error::new("Bad Credentials")),
        ));
    };

    let ulid_id: Ulid = user.id.parse::<Uuid>().expect("schema is uuid").into();

    let token = RequireLogin { id: ulid_id }
        .sign_with_key(&state.jwt_secret)
        .expect("RequireLogin is valid serde_json");

    Ok((
        AppendHeaders([(
            SET_COOKIE,
            format!("session={token}; HttpOnly; SameSite=Lax; Path=/"),
        )]),
        authuser!(user),
    ))
}

async fn logout(jar: CookieJar) -> impl IntoResponse {
    jar.remove("session")
}

pub fn routes() -> Router<BlogDrownState> {
    Router::new()
        .route("/", get(auth_info))
        .route("/signup", post(signup))
        .route("/login", post(login))
        .route("/logout", post(logout))
}
