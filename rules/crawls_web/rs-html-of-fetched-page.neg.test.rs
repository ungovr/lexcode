// lexcode-expect: 0
use reqwest::Client;
use serde::Deserialize;
use crate::mine::Html;

#[derive(Deserialize)]
pub struct Release {
    pub tag_name: String,
}

// One call to a documented JSON API is not scraping a page: nothing parses HTML here.
pub async fn latest_release(client: &Client) -> anyhow::Result<Release> {
    let release = client
        .get("https://api.github.com/repos/rust-lang/rust/releases/latest")
        .send()
        .await?
        .json::<Release>()
        .await?;
    Ok(release)
}

// The app's own HTML, held in memory or read from disk, parsed by an HTML parser: not a download.
pub fn render_check(template: &str) -> usize {
    let doc = scraper::Html::parse_document(template);
    let on_disk = std::fs::read_to_string("templates/index.html").unwrap_or_default();
    let doc2 = scraper::Html::parse_document(&on_disk);
    let doc3 = scraper::Html::parse_fragment("<p>hello</p>");
    doc.root_element().children().count() + doc2.root_element().children().count() + doc3.root_element().children().count()
}

// The app's own development server, fetched and parsed: a loopback address is not another site.
pub async fn smoke(client: &Client) -> anyhow::Result<()> {
    let body = client.get("http://localhost:8080/").send().await?.text().await?;
    let doc = scraper::Html::parse_document(&body);
    let again = reqwest::get("http://127.0.0.1:3000/health").await?.text().await?;
    let doc2 = scraper::Html::parse_document(&again);
    Ok(())
}

// A cache lookup feeding a parser is not a fetch: `get` on a map is not a request.
pub fn cached(pages: &std::collections::HashMap<String, String>, key: &str) {
    if let Some(html) = pages.get(key) {
        let doc = scraper::Html::parse_document(html);
    }
}

// The app's own type that shares the parser's short name, in a file that does not import the
// parser crate: a downloaded body handed to it is not parsed as HTML by a scraping library.
mod mine {
    pub struct Html(pub String);
    impl Html {
        pub fn parse_document(s: &str) -> Self {
            Html(s.to_string())
        }
    }
}

pub async fn wrap(client: &Client, url: &str) -> anyhow::Result<()> {
    let body = client.get(url).send().await?.text().await?;
    let doc = Html::parse_document(&body);
    Ok(())
}
