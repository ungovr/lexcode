// lexcode-expect: 0
use std::collections::HashMap;

// A file that uses no UI or template crate. A game's entity component named Registration, an
// XML builder's Element, a dependency-injection attribute named component, and a report's own
// render method.
pub trait Component {
    fn id(&self) -> u32;
}

pub struct Registration;

impl Component for Registration {
    fn id(&self) -> u32 {
        7
    }
}

pub struct Element(pub String);

#[allow(non_snake_case)]
pub fn SignUp(name: &str) -> Element {
    Element(format!("<signup>{name}</signup>"))
}

pub use di::component;

#[component]
pub fn Register() -> HashMap<String, u32> {
    HashMap::new()
}

pub struct Report;

impl Report {
    pub fn render(&self, name: &str, _rows: &[u32]) -> String {
        name.to_string()
    }
}

pub fn print(report: &Report) -> String {
    report.render("register", &[])
}

mod di {
    pub use std::convert::identity as component;
}
