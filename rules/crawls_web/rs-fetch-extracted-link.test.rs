// lexcode-expect: 7
use std::collections::{HashSet, VecDeque};

use reqwest::{get, Client};
use reqwest as rq;
use scraper::{Html, Selector};
use select::document::Document;
use select::predicate::Name;
use url::Url;

// A breadth-first crawl: each page's links are queued and fetched in turn.
pub async fn crawl(client: &Client, start: &str) -> anyhow::Result<()> {
    let base = Url::parse(start)?;
    let mut queue = VecDeque::new();
    let mut seen = HashSet::new();
    let body = client.get(start).send().await?.text().await?;
    let doc = Html::parse_document(&body);
    let sel = Selector::parse("a").unwrap();
    for a in doc.select(&sel) {
        if let Some(href) = a.value().attr("href") {
            let next = base.join(href)?;
            queue.push_back(next);
        }
    }
    while let Some(next) = queue.pop_front() {
        if seen.insert(next.to_string()) {
            let page = client
                .get(next.as_str())
                .send()
                .await?;
        }
    }
    Ok(())
}

// A link read and fetched in the same loop, through the grouped `use` and the crate's alias.
pub async fn follow(doc: &Html, sel: &Selector) -> anyhow::Result<()> {
    for el in doc.select(sel) {
        let link = el.value().attr("href").unwrap_or_default();
        let resp = get(link).await?;
        let again = rq::get(link).await?;
    }
    Ok(())
}

// Links collected with an iterator chain, then fetched; an image's `src` from the select crate.
pub async fn collect_then_fetch(client: &Client, doc: &Html, sel: &Selector) -> anyhow::Result<()> {
    let links: Vec<String> = doc
        .select(sel)
        .filter_map(|e| e.value().attr("href"))
        .map(String::from)
        .collect();
    for l in &links {
        client.get(l).send().await?;
    }
    let page = Document::from(include_str!("page.html"));
    for img in page.find(Name("img")).filter_map(|n| n.attr("src")) {
        let bytes = reqwest::blocking::get(img)?.bytes()?;
    }
    Ok(())
}

// A headless browser that opens each link it reads.
pub async fn browse(page: &chromiumoxide::Page) -> anyhow::Result<()> {
    for el in page.find_elements("a").await? {
        if let Some(href) = el.attribute("href").await? {
            page.goto(href).await?;
        }
    }
    Ok(())
}

// headless_chrome: the next page's link read from the page and opened in the same tab.
pub fn paginate(tab: &headless_chrome::Tab) -> anyhow::Result<()> {
    let anchor = tab.find_element("a.next")?;
    if let Some(next) = anchor.get_attribute_value("href")? {
        tab.navigate_to(&next)?;
    }
    Ok(())
}
