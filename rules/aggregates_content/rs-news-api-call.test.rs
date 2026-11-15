// lexcode-expect: 5
use reqwest::Client;

const NEWS_API: &str = "https://newsapi.org/v2";

// Headlines and article snippets pulled from third-party news APIs, whichever client sends them.
pub async fn headlines(client: &Client, key: &str, q: &str) -> anyhow::Result<()> {
    client
        .get(format!("{NEWS_API}/top-headlines?country=us"))
        .header("X-Api-Key", key)
        .send()
        .await?;
    client
        .get("https://gnews.io/api/v4/search")
        .query(&[("q", q), ("apikey", key)])
        .send()
        .await?;
    let guardian = reqwest::get(format!(
        "https://content.guardianapis.com/search?q={q}&api-key={key}"
    ))
    .await?;
    let nyt = reqwest::get(format!("https://api.nytimes.com/svc/topstories/v2/home.json?api-key={key}")).await?;
    let base = r#"https://newsdata.io/api/1/latest"#;
    Ok(())
}
