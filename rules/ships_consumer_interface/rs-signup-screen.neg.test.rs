// lexcode-expect: 0
use askama::Template;
use leptos::prelude::*;
use tera::{Context, Tera};

// The definition's exclusion: a tool only the staff use. An admin screen for adding accounts,
// its template and its form.
#[component]
pub fn AdminRegisterUser() -> impl IntoView {
    view! { <h1>"Add a user"</h1> }
}

#[derive(Template)]
#[template(path = "admin/register.html")]
pub struct AdminRegisterTemplate {
    pub error: Option<String>,
}

pub fn admin_page(tera: &Tera) -> tera::Result<String> {
    tera.render("admin/register.html", &Context::new())
}

pub fn admin_form() -> String {
    String::from(r#"<form method="post" action="/admin/users/register"></form>"#)
}

// Lookalikes: the sign-in screen and its form, and a button that registers for an event.
#[component]
pub fn Login() -> impl IntoView {
    view! { <form method="post" action="/login"></form> }
}

#[component]
pub fn RegisterButton() -> impl IntoView {
    view! { <button>"Register for the meetup"</button> }
}

pub fn login_page(tera: &Tera) -> tera::Result<String> {
    tera.render("login.html", &Context::new())
}
