// lexcode-expect: 5
use dioxus::prelude::*;
use leptos::prelude::*;
use leptos_router::{components::{Route, Router, Routes}, path, StaticSegment};
use warp::Filter;

// Leptos: the sign-up page's route, written with the path! macro and with a static segment.
#[component]
pub fn App() -> impl IntoView {
    view! {
        <Router>
            <Routes fallback=|| "Not found.">
                <Route path=path!("/signup") view=SignUp/>
                <Route path=StaticSegment("create-account") view=SignUp/>
            </Routes>
        </Router>
    }
}

// Dioxus: the router enum's sign-up route.
#[derive(Routable, Clone, PartialEq)]
enum Route {
    #[route("/")]
    Home {},
    #[route("/sign-up")]
    SignUp {},
}

// warp: the register filter, with the path! macro and with path().
pub fn routes() -> impl Filter<Extract = (String,), Error = warp::Rejection> + Clone {
    let a = warp::path!("api" / "register").map(|| String::from("ok"));
    let b = warp::path("signup").map(|| String::from("ok"));
    a.or(b).unify()
}
