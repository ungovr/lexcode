// lexcode-expect: 3
use reqwest::{header::RANGE, Client};
use webpage::{HTML, OpengraphObject};

// A preview built in two steps, as federated link aggregators do: the posted link's page is
// fetched in one function and its Open Graph tags read in another.
pub async fn fetch_link_metadata(client: &Client, url: &url::Url) -> anyhow::Result<Vec<u8>> {
    let response = client
        .get(url.as_str())
        .header(RANGE, "bytes=0-1048575")
        .send()
        .await?
        .error_for_status()?;
    Ok(response.bytes().await?.to_vec())
}

pub fn extract_opengraph(html: &[u8]) -> anyhow::Result<Option<String>> {
    let page = HTML::from_string(String::from_utf8_lossy(html).into_owned(), None)?;
    let image: Option<&OpengraphObject> = page.opengraph.images.first();
    Ok(image.map(|i| i.url.clone()))
}

// The same through the crate's top-level `get` and a blocking client.
pub async fn quick(link: &str) -> anyhow::Result<String> {
    let body = reqwest::get(link).await?.text().await?;
    let again = reqwest::blocking::get(link)?.text()?;
    Ok(body)
}
