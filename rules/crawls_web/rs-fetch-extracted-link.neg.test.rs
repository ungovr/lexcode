// lexcode-expect: 0
use reqwest::Client;
use scraper::{Html, Selector};

// Reading the links on a page without fetching them (a sitemap the app renders, a link count) is
// not following them.
pub fn outline(doc: &Html) -> Vec<String> {
    let sel = Selector::parse("a").unwrap();
    doc.select(&sel)
        .filter_map(|a| a.value().attr("href"))
        .map(|h| h.to_string())
        .collect()
}

// An attribute that is not a link (alt text, a class) sent to the app's own API is not a crawl.
pub async fn alt_texts(client: &Client, doc: &Html) -> anyhow::Result<()> {
    let sel = Selector::parse("img").unwrap();
    for img in doc.select(&sel) {
        let alt = img.value().attr("alt").unwrap_or_default();
        let class = img.value().attr("class").unwrap_or_default();
        client
            .post("https://api.example.com/alt-text")
            .body(format!("{alt} {class}"))
            .send()
            .await?;
    }
    Ok(())
}

// A data attribute (an id) joined onto the app's own API base is a lookup, not a link read from
// the page.
pub async fn lookup(client: &Client, doc: &Html, api: &url::Url) -> anyhow::Result<()> {
    let sel = Selector::parse("[data-video-id]").unwrap();
    for el in doc.select(&sel) {
        if let Some(id) = el.value().attr("data-video-id") {
            let meta = client.get(api.join(id)?).send().await?;
        }
    }
    Ok(())
}

// A fixed page fetched once, beside a link read from a page that is only stored.
pub async fn snapshot(client: &Client, doc: &Html, store: &mut Vec<String>) -> anyhow::Result<()> {
    let sel = Selector::parse("link[rel=canonical]").unwrap();
    if let Some(el) = doc.select(&sel).next() {
        if let Some(canonical) = el.value().attr("href") {
            store.push(canonical.to_string());
        }
    }
    let page = client.get("https://status.example.com/").send().await?;
    Ok(())
}

// A query parameter named `src` read by the app's own handler is not a link taken from a page.
pub async fn proxy(client: &Client, params: &std::collections::HashMap<String, String>) -> anyhow::Result<()> {
    if let Some(src) = params.get("src") {
        let image = client.get(src).send().await?;
    }
    Ok(())
}
