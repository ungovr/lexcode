// lexcode-expect: 8
use reqwest::{get, Client};
use reqwest as rq;
use scraper::{Html, Selector};
use scraper as sc;
use select::document::Document;

pub struct AppState {
    pub http: Client,
}

// A listing page downloaded and parsed with scraper, imported through a grouped `use`.
pub async fn prices(client: &Client) -> anyhow::Result<Vec<String>> {
    let resp = client.get("https://shop.example.com/listing").send().await?;
    let body = resp.text().await?;
    let doc = Html::parse_document(&body);
    let sel = Selector::parse(".price").unwrap();
    Ok(doc.select(&sel).map(|e| e.inner_html()).collect())
}

// The crate's top-level `get`, under the grouped `use`, and through the crate's alias.
pub async fn headlines(url: &str) -> anyhow::Result<()> {
    let page = get(url).await?.text().await?;
    let doc = Html::parse_document(&page);
    let other = rq::get("https://news.example.org/").await?.text().await?;
    let doc2 = sc::Html::parse_document(&other);
    Ok(())
}

// The blocking client, downloaded inside the parser call itself.
pub fn article(url: &str) -> anyhow::Result<()> {
    let doc = Html::parse_document(&reqwest::blocking::get(url)?.text()?);
    let frag = Html::parse_fragment(&rq::blocking::get(url)?.text()?);
    Ok(())
}

// A client held in state, the request built over several lines with a header on the way.
pub async fn listing(state: &AppState, target: &str) -> anyhow::Result<()> {
    let html = state
        .http
        .get(target)
        .header("User-Agent", "price-bot/1.0")
        .send()
        .await?
        .text()
        .await?;
    let document = scraper::Html::parse_document(&html);
    Ok(())
}

// ureq's blocking agent, and the select crate's document.
pub fn with_ureq(url: &str) -> anyhow::Result<()> {
    let body = ureq::get(url).call()?.into_string()?;
    let doc = Document::from(body.as_str());
    let agent = ureq::AgentBuilder::new().build();
    let page = agent.get(url).call()?.into_string()?;
    let dom = tl::parse(&page, tl::ParserOptions::default())?;
    Ok(())
}
