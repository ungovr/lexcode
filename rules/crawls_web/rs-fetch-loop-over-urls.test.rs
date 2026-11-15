// lexcode-expect: 9
use futures::{stream, StreamExt};
use reqwest::{blocking, Client};
use reqwest as rq;

pub struct Site {
    pub url: String,
}

// Each address in a list fetched in a `for` loop, through the grouped `use` and the crate's alias.
pub async fn check(client: &Client, urls: Vec<String>) -> anyhow::Result<()> {
    for url in &urls {
        let resp = client.get(url).send().await?;
    }
    for u in urls.clone() {
        let body = rq::get(&u).await?.text().await?;
    }
    for (i, link) in urls.iter().enumerate() {
        tokio::spawn(rq::get(link.clone()));
    }
    for target in urls.iter() {
        let page = blocking::get(target.as_str())?;
    }
    Ok(())
}

// A field of each item in a list, sent through a client held in state over several lines.
pub async fn sites(state: &AppState, sites: Vec<Site>) -> anyhow::Result<()> {
    for site in &sites {
        let resp = state
            .http_client
            .get(&site.url)
            .header("User-Agent", "monitor/1.0")
            .send()
            .await?;
    }
    Ok(())
}

// Iterator and stream closures, the usual shape of a concurrent fetcher.
pub async fn concurrent(client: Client, urls: Vec<String>) {
    let bodies = stream::iter(urls.clone())
        .map(|url| {
            let client = client.clone();
            async move { client.get(url).send().await }
        })
        .buffer_unordered(8);
    let pending: Vec<_> = urls.iter().map(|u| client.get(u.as_str()).send()).collect();
    urls.iter().for_each(|link| {
        let r = reqwest::blocking::get(link);
    });
    let agent = ureq::agent();
    urls.iter().for_each(|link| {
        let r = agent.get(link).call();
    });
}

pub struct AppState {
    pub http_client: Client,
}
