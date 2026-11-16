// lexcode-expect: 0
use scraper::{Html, Selector};

// The app writing Open Graph tags for its own pages is publishing, not reading another site's.
pub fn own_meta(title: &str, image: &str) -> String {
    format!(
        "<meta property=\"og:title\" content=\"{title}\"><meta property=\"og:image\" content=\"{image}\">"
    )
}

// Reading other parts of a page (its links, its prices) is not building a preview of it.
pub fn prices(doc: &Html) -> Vec<String> {
    let sel = Selector::parse(".price").unwrap();
    let links = Selector::parse("a[href]").unwrap();
    let desc = Selector::parse("meta[name=viewport]").unwrap();
    doc.select(&sel).map(|e| e.inner_html()).collect()
}

// A link a person posts, stored and shown as a link, with no fetched title, excerpt or image.
pub struct Post {
    pub url: Option<url::Url>,
}

pub fn link_only(post: &Post) -> String {
    post.url.as_ref().map(|u| format!("<a href=\"{u}\">{u}</a>")).unwrap_or_default()
}

// webpage's HTML type given a literal page (a sample in the code) reads no one's content.
pub fn sample() {
    let page = webpage::HTML::from_string("<html><title>x</title></html>".to_string(), None);
}
