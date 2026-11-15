// lexcode-expect: 1
use poem::{handler, web::Form, Route, post};

#[derive(serde::Deserialize)]
pub struct NewUser {
    email: String,
}

// Poem: the sign-up form's handler.
#[handler]
pub async fn signup(Form(user): Form<NewUser>) -> String {
    user.email
}

pub fn app() -> Route {
    Route::new().at("/home", post(signup))
}
