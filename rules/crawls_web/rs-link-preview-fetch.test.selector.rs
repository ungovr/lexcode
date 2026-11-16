// lexcode-expect: 1
use reqwest::Client;
use scraper::{Html, Selector};

pub struct Card {
    pub title: Option<String>,
}

// The posted link's page fetched, then its Open Graph title read with a scraper selector written
// over two lines.
pub async fn unfurl(client: &Client, posted: String) -> anyhow::Result<Card> {
    let html = client.get(&posted).send().await?.text().await?;
    Ok(read_card(&html))
}

fn read_card(html: &str) -> Card {
    let doc = Html::parse_document(html);
    let sel = Selector::parse(
        r#"meta[property="og:title"]"#,
    )
    .unwrap();
    Card { title: doc.select(&sel).next().and_then(|e| e.value().attr("content")).map(String::from) }
}
