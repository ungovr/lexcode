// lexcode-expect: 0
// A file that names no browser crate in a `use` line or a path: the app's own `goto`,
// `navigate_to` and `new_page` are a router, a wizard and a document model, not a browser.

pub struct Router {
    stack: Vec<String>,
}

impl Router {
    pub fn goto(&mut self, route: &str) {
        self.stack.push(route.to_string());
    }
    pub fn navigate_to(&mut self, route: String) {
        self.stack.push(route);
    }
}

pub struct Notebook {
    pages: Vec<String>,
}

impl Notebook {
    pub fn new_page(&mut self, title: &str) -> usize {
        self.pages.push(title.to_string());
        self.pages.len()
    }
}

pub fn wizard(router: &mut Router, nb: &mut Notebook, next: &str) {
    router.goto("https://example.com/step/2");
    router.goto(next);
    router.navigate_to(format!("/settings/{next}"));
    router.navigate_to(next.to_string());
    nb.new_page("https://example.com/notes");
}
