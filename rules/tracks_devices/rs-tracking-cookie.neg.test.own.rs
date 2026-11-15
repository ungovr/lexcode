// lexcode-expect: 0
use std::fmt;

// The app's own Cookie, in a file with no cookie library: a baked cookie in a shop's inventory.
pub struct Cookie {
    pub name: String,
    pub flavor: String,
}

impl Cookie {
    pub fn new(name: &str, flavor: &str) -> Self {
        Cookie { name: name.to_owned(), flavor: flavor.to_owned() }
    }
}

impl fmt::Display for Cookie {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.name)
    }
}

pub fn bake() -> Cookie {
    Cookie::new("visitor_id", "oatmeal")
}
