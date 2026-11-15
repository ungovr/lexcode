// lexcode-expect: 0
use reqwest::Client;
use webpage::HTML;

// In a file that reads preview metadata, the fetches that are not a posted link's page: an address
// built with `format!` on the app's own media server, a fixed API address, and the app's own
// development server.
pub async fn thumbnail(client: &Client, pictrs: &str, image_url: &str) -> anyhow::Result<()> {
    let fetch_url = format!("{pictrs}image/download?url={image_url}");
    let res = client.get(&fetch_url).send().await?;
    let proxy_url = format!("{pictrs}image/original?proxy={image_url}");
    client
        .get(&proxy_url)
        .send()
        .await?;
    client.get(format!("{pictrs}healthz")).send().await?;
    client.get("https://api.example.com/v1/limits").send().await?;
    reqwest::get("http://localhost:8080/").await?;
    Ok(())
}

// Parsing a page the app already holds fetches nothing, and a cache lookup is not a request.
pub fn title(cache: &std::collections::HashMap<String, String>, key: String) -> Option<String> {
    let html = cache.get(&key)?.clone();
    HTML::from_string(html, None).ok().and_then(|h| h.title)
}
