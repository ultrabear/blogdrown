use axum::{
    async_trait,
    extract::{FromRequestParts, State},
    http::{request::Parts, StatusCode},
    response::{IntoResponse, IntoResponseParts},
    routing::{get, post},
    Json, Router,
};
use axum_extra::extract::{
    cookie::{Cookie, SameSite},
    CookieJar,
};
use chrono::{DateTime, FixedOffset, TimeDelta, Utc};
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
    api::{ApiError, ApiJson, AuthUser, Created, Error, Login, MinUser, Signup},
    bounded::BoundString,
    prisma, BlogDrownState,
};

const SESSION_COOKIE: &str = "session";

fn session_cookie<'a>(value: impl Into<String>, production: bool) -> Cookie<'a> {
    let mut session_cookie = Cookie::new(SESSION_COOKIE, value.into());

    session_cookie.set_same_site(SameSite::Lax);
    session_cookie.set_http_only(true);
    session_cookie.set_path("/");

    if production {
        session_cookie.set_secure(true);
    }

    session_cookie
}

#[derive(serde_derive::Serialize, serde_derive::Deserialize)]
pub struct RequireLogin {
    pub id: ulid::Ulid,
    pub creat: DateTime<Utc>,
}

impl RequireLogin {
    pub fn uuid(&self) -> String {
        Uuid::from(self.id).to_string()
    }
}

fn scrypt_hash(password: SecretString, production: bool) -> String {
    use scrypt::Params;

    let scrypt_params = (if production {
        Params::new(
            Params::RECOMMENDED_LOG_N - 3,
            Params::RECOMMENDED_R + 2,
            Params::RECOMMENDED_P + 1,
            Params::RECOMMENDED_LEN,
        )
    } else {
        Params::new(5, 5, Params::RECOMMENDED_P, Params::RECOMMENDED_LEN)
    })
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

        let Some(cookie) = jar.get(SESSION_COOKIE) else {
            return Err(reject());
        };

        let login: RequireLogin = cookie
            .value()
            .verify_with_key(&state.jwt_secret)
            .map_err(|_| reject())?;

        if (login.creat + TimeDelta::days(30)) < Utc::now() {
            return Err(reject());
        }

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
            email: BoundString::new_unchecked($user.email),
            created_at: $user.created_at,
            min: MinUser {
                id: $user.id.parse::<Uuid>().expect("schema is uuid").into(),
                username: BoundString::new_unchecked($user.username),
            },
        })
    };
}

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
    jar: CookieJar,
    State(state): State<BlogDrownState>,
    ApiJson(signup): ApiJson<Signup>,
) -> Result<(impl IntoResponseParts, Created<Json<AuthUser>>), ApiError> {
    let query = state.prisma;

    use prisma::user;

    let existing = query
        .user()
        .count(vec![or![
            user::username::equals(signup.username.clone().into_inner()),
            user::email::equals(signup.email.clone().into_inner())
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
                .count(vec![user::username::equals(username.into_inner())])
                .exec()
                .await
                .map_err(Error::from_query)
        });
        let equery = query.clone();
        let email = signup.email.clone();
        let email = tokio::spawn(async move {
            equery
                .user()
                .count(vec![user::email::equals(email.into_inner())])
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
            signup.username.into_inner(),
            signup.email.into_inner(),
            scrypt_hash(signup.password, state.production),
            vec![],
        )
        .select(user::select!({id email username created_at}))
        .exec()
        .await
        .map_err(Error::from_query)?;

    let ulid_id: Ulid = user.id.parse::<Uuid>().expect("schema is uuid").into();

    let token = RequireLogin {
        id: ulid_id,
        creat: Utc::now(),
    }
    .sign_with_key(&state.jwt_secret)
    .expect("RequireLogin is valid serde_json");

    Ok((
        jar.add(session_cookie(token, state.production)),
        Created(authuser!(user)),
    ))
}

async fn login(
    jar: CookieJar,
    State(state): State<BlogDrownState>,
    ApiJson(login): ApiJson<Login>,
) -> Result<(impl IntoResponseParts, Json<AuthUser>), ApiError> {
    use prisma::user;

    let bad_creds = Err((
        StatusCode::UNAUTHORIZED,
        Json(Error::new("Bad Credentials")),
    ));

    let user = state
        .prisma
        .user()
        .find_unique(user::email::equals(login.email.clone().into_inner()))
        .select(user::select!({
            id password email created_at username
        }))
        .exec()
        .await
        .map_err(Error::from_query)?;

    let Some(user) = user else {
        return bad_creds;
    };

    let Ok(()) = scrypt_verify(login.password, user.password) else {
        return bad_creds;
    };

    let ulid_id: Ulid = user.id.parse::<Uuid>().expect("schema is uuid").into();

    let token = RequireLogin {
        id: ulid_id,
        creat: Utc::now(),
    }
    .sign_with_key(&state.jwt_secret)
    .expect("RequireLogin is valid serde_json");

    Ok((
        jar.add(session_cookie(token, state.production)),
        authuser!(user),
    ))
}

async fn logout(jar: CookieJar, State(state): State<BlogDrownState>) -> impl IntoResponse {
    jar.remove(session_cookie("", state.production))
}

pub fn routes() -> Router<BlogDrownState> {
    Router::new()
        .route("/", get(auth_info))
        .route("/signup", post(signup))
        .route("/login", post(login))
        .route("/logout", post(logout))
}
