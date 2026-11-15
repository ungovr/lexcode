// lexcode-expect: 4
use handlebars::Handlebars;
use minijinja::Environment;
use rocket_dyn_templates::{context, Template};
use tera::{Context, Tera};

// Rocket's dynamic templates: the sign-up page.
#[rocket::get("/join")]
pub fn join() -> Template {
    Template::render("register", context! { title: "Join" })
}

// Tera, Handlebars and MiniJinja rendering the sign-up template.
pub fn tera_page(tera: &Tera) -> tera::Result<String> {
    tera.render("auth/signup.html", &Context::new())
}

pub fn hbs_page(hb: &Handlebars<'_>) -> Result<String, handlebars::RenderError> {
    hb.render("create-account", &serde_json::json!({}))
}

pub fn jinja_page(env: &Environment<'_>) -> Result<String, minijinja::Error> {
    env.get_template("registration.html")?.render(minijinja::context! {})
}
