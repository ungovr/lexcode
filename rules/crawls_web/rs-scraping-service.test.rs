// lexcode-expect: 9
use firecrawl::{crawl::CrawlOptions, FirecrawlApp};
use firecrawl as fc;
use reqwest::{Client, Proxy};

// Firecrawl's SDK, imported through a grouped `use` with a nested path and through its alias.
pub async fn firecrawl_jobs(key: &str) -> anyhow::Result<()> {
    let app = FirecrawlApp::new(key)?;
    let page = app.scrape_url("https://news.example.org", None).await?;
    let site = app
        .crawl_url("https://shop.example.com", None)
        .await?;
    let other = fc::FirecrawlApp::new(key)?;
    let links = other.map_url("https://shop.example.com", None).await?;
    Ok(())
}

// Scraping and fetch APIs called over plain HTTP.
pub async fn via_http(client: &Client, key: &str, target: &str) -> anyhow::Result<()> {
    client
        .get("https://app.scrapingbee.com/api/v1/")
        .query(&[("api_key", key), ("url", target)])
        .send()
        .await?;
    client.get(format!("https://api.scraperapi.com/?api_key={key}&url={target}")).send().await?;
    client.post("https://api.zyte.com/v1/extract").basic_auth(key, Some("")).send().await?;
    client.get(format!("https://r.jina.ai/{target}")).send().await?;
    Ok(())
}

// A scraping proxy that fetches each page on the app's behalf.
pub fn proxied(user: &str) -> anyhow::Result<Client> {
    let proxy = Proxy::all("http://brd-customer-hl_123-zone-web:secret@brd.superproxy.io:22225")?;
    let raw = Proxy::all(r#"http://scraperapi:KEY@proxy-server.scraperapi.com:8001"#)?;
    Ok(Client::builder().proxy(proxy).proxy(raw).build()?)
}
