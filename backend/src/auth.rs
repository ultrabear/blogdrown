use axum::{async_trait, http::{request::Parts, StatusCode}};

use crate::{prisma, BlogDrownState};


struct RequireLogin(uuid::Uuid);


#[async_trait]
impl axum::extract::FromRequestParts<BlogDrownState> for RequireLogin {

    type Rejection = (StatusCode, &'static str);


    async fn from_request_parts(parts: &mut Parts, state: &BlogDrownState) -> Result<Self, Self::Rejection> {

 
        todo!()


    }


}
