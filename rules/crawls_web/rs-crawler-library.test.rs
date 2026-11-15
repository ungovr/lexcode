// lexcode-expect: 6
use spider::{tokio, website::Website};
use spider as sp;
use texting_robots::{get_robots_url, Robot};
use robotstxt::DefaultMatcher;

// spider through a grouped `use` with a nested path, and through the crate's alias.
pub async fn crawl_site(start: &str) {
    let mut website = Website::new("https://rsseau.fr");
    website.crawl().await;
    let mut other = sp::website::Website::new(start)
        .with_respect_robots_txt(true)
        .build()
        .unwrap();
    other.scrape().await;
}

// A crawler reading a site's robots.txt for its own user agent before it fetches.
pub fn may_fetch(robots_body: &[u8], url: &str) -> bool {
    let robots = Robot::new("PriceBot", robots_body).unwrap();
    let full = texting_robots::Robot::new("PriceBot/1.0", robots_body);
    robots.allowed(url)
}

pub fn google_matcher(robots_body: &str, url: &str) -> bool {
    let mut matcher = DefaultMatcher::default();
    let one = matcher.one_agent_allowed_by_robots(robots_body, "PriceBot", url);
    let many = matcher
        .allowed_by_robots(robots_body, vec!["PriceBot", "Googlebot"], url);
    one && many
}
