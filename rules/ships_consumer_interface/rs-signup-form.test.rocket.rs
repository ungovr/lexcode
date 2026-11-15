// lexcode-expect: 1
use rocket::{form::Form, post, response::Redirect};

#[derive(rocket::FromForm, serde::Deserialize)]
pub struct NewUser {
    email: String,
    password: String,
}

// Rocket: the registration form's handler, a plain fn.
#[post("/register", data = "<form>")]
pub fn registration(form: Form<NewUser>) -> Redirect {
    let _ = (&form.email, &form.password);
    Redirect::to("/")
}
