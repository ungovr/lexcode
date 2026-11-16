// lexcode-expect: 5
use askama::Template;
use leptos::prelude::*;
use maud::{html, Markup};

// Leptos: the sign-up page component, by the attribute's short name and its full path.
#[component]
pub fn SignUp() -> impl IntoView {
    view! { <h1>"Create your account"</h1> }
}

#[leptos::component]
fn RegisterPage(invite: Option<String>) -> impl IntoView {
    view! { <p>{invite}</p> }
}

// askama: the registration page's template.
#[derive(Template)]
#[template(path = "auth/register.html")]
pub struct JoinTemplate {
    pub error: Option<String>,
}

// Inline HTML: a page whose form posts to the sign-up path.
pub fn page() -> String {
    format!(
        r#"<!DOCTYPE html>
<html lang="en">
<body>
    <form method="post" action="/signup">
        <input type="email" name="email">
        <button type="submit">Sign up</button>
    </form>
</body>
</html>"#
    )
}

// maud: the same form in its markup.
pub fn maud_page() -> Markup {
    html! {
        form action="/users/register" method="post" {
            input type="email" name="email";
        }
    }
}
