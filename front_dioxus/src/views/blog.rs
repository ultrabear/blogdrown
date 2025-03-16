use crate::Route;
use dioxus::prelude::*;

const BLOG_CSS: Asset = asset!("/assets/styling/blog.css");

#[component]
pub fn Blog(id: String) -> Element {
    let mut post = use_resource(move || {
        let id = id.clone();
        async move {
            let url = format!("http://localhost:5000/api/v1/blogs/one?id={}", id);
            reqwest::get(&url).await.unwrap().text().await.unwrap()
        }
    });

    let p = post.cloned().unwrap_or_default();

    

    

    

    rsx! {
        document::Link { rel: "stylesheet", href: BLOG_CSS}

        div {
            class: "BlogPost",
            div {
                class: "metabox",
                div {
                    div { class: "title", "{p}" }
                }
            }
        }
    }
}
