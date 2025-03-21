use dioxus::prelude::*;

use components::Navbar;
use views::{Blog, Home};

mod components;
mod views;
mod apitypes;

#[derive(Debug, Clone, Routable, PartialEq)]
enum Route {
    #[layout(Navbar)]
    #[route("/")]
    Home {},
    #[route("/blog/:id")]
    Blog { id: ulid::Ulid },
}

const INDEX_CSS: Asset = asset!("/assets/styling/index.css");

fn main() {
    dioxus::launch(App);
}

#[component]
fn App() -> Element {
    // Build cool things ✌️

    rsx! {

        "BlogDrown"

        // Global app resources
        document::Link { rel: "stylesheet", href: INDEX_CSS }


        Router::<Route> {}
    }
}
