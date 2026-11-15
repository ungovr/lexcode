// lexcode-expect: 0
// The app's own `HTML`, `Webpage` and `Selector` types, in a file that imports none of webpage,
// opengraph or scraper: a template engine and a CSS linter.
use crate::css::Selector;
use crate::template::{Webpage, HTML};

pub fn render(body: String, url: &str) {
    let page = HTML::from_string(body, None);
    let site = Webpage::from_url(url, Default::default());
    let rule = Selector::parse("meta[property=\"og:title\"]");
}
