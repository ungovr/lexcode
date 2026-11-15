// lexcode-expect: 0
// A file that reads no preview metadata: a fetch of an address held in a variable is not a link
// preview here (the other crawl rules judge it). Comments naming the crates, and the app writing
// Open Graph tags for its own pages, do not count:
// use webpage::{HTML, Webpage};
// use opengraph::scrape;
// Selector::parse("meta[property=\"og:title\"]") was the old approach
use reqwest::Client;

pub fn own_meta(title: &str) -> String {
    format!("<meta property=\"og:title\" content=\"{title}\">")
}

pub async fn download(client: &Client, url: &str) -> anyhow::Result<Vec<u8>> {
    Ok(client.get(url).send().await?.bytes().await?.to_vec())
}
