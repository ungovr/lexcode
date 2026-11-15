// lexcode-expect: 0
use reqwest::Client;

// Other APIs on news-sounding hosts, and links to news sites shown to a person, are not a news
// API's headlines.
pub async fn other_apis(client: &Client, key: &str) -> anyhow::Result<()> {
    client.get("https://api.github.com/repos/rust-lang/rust/releases").send().await?;
    client.get("https://newsapi.org/pricing").send().await?;
    client
        .get(format!("https://api.nytimes.com/svc/books/v3/lists/current/hardcover-fiction.json?api-key={key}"))
        .send()
        .await?;
    client.get("https://www.theguardian.com/international").send().await?;
    Ok(())
}

// The app's own newsletter API.
pub async fn own(client: &Client) -> anyhow::Result<()> {
    client.get("https://news.example.com/api/v1/issues").send().await?;
    Ok(())
}
