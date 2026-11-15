// lexcode-expect: 0
// A file that names no crawler crate: the app's own `Website` and `Robot` types, a site's own
// robots.txt served to visitors, and a config file read from disk. Comments that name the crates
// do not count:
// use spider::website::Website;   (dropped)
// use robotstxt::DefaultMatcher;  (dropped)
use crate::model::{Robot, Website};

pub fn register(name: &str, url: &str) -> Website {
    let site = Website::new(url);
    let bot = Robot::new("helper", b"rules");
    site
}

// The app's own policy check, named like the robotstxt matcher's methods.
pub fn may_show(policy: &crate::model::Policy, agent: &str, url: &str) -> bool {
    policy.one_agent_allowed_by_robots("", agent, url) && policy.allowed_by_robots("", vec![agent], url)
}

pub async fn robots_txt() -> &'static str {
    "User-agent: *\nDisallow: /admin\n"
}

pub mod model {
    pub struct Website {
        pub url: String,
    }
    impl Website {
        pub fn new(url: &str) -> Self {
            Website { url: url.to_string() }
        }
    }
    pub struct Policy;
    impl Policy {
        pub fn one_agent_allowed_by_robots(&self, _b: &str, _a: &str, _u: &str) -> bool {
            true
        }
        pub fn allowed_by_robots(&self, _b: &str, _a: Vec<&str>, _u: &str) -> bool {
            true
        }
    }
    pub struct Robot;
    impl Robot {
        pub fn new(_name: &str, _rules: &[u8]) -> Self {
            Robot
        }
    }
}
