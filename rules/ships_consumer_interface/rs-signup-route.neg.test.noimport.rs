// lexcode-expect: 0
use std::collections::HashMap;

// The app's own resource(), in a file that uses no web framework: a static asset table keyed by
// path, not an actix-web route.
pub struct Resource {
    pub path: &'static str,
    pub bytes: usize,
}

pub fn resource(path: &'static str) -> Resource {
    Resource { path, bytes: 0 }
}

pub fn assets() -> HashMap<&'static str, Resource> {
    let mut map = HashMap::new();
    map.insert("register", resource("/register"));
    map.insert("signup", resource("/signup"));
    map
}
