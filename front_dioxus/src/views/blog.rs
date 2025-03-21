use crate::Route;
use dioxus::prelude::*;

const BLOG_CSS: Asset = asset!("/assets/styling/blog.css");

#[component]
pub fn Blog(id: ulid::Ulid) -> Element {

    let mut post = use_resource(move || {
        async move {

            crate::apitypes::blogs::get_one(id).await.unwrap()
        }
    });

    let p = post.cloned();


    

    rsx! {
        document::Link { rel: "stylesheet", href: BLOG_CSS}

        div {
            class: "BlogPost",
            div {
                class: "metabox",
                div {
                    div { class: "title", "{p:?}" }
                }
            }
        }
    }
}
