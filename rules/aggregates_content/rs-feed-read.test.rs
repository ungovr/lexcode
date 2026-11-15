// lexcode-expect: 12
use std::str::FromStr;

use feed_rs::{model::Feed, parser};
use feed_rs as fr;
use rss::{Channel, Item};
use rss as rs_feed;
use atom_syndication::Feed as AtomFeed;
use atom_syndication as atom;
use syndication as synd;

// feed-rs over a body downloaded the line before, through a grouped `use` and through the alias.
pub async fn headlines(client: &reqwest::Client, url: &str) -> anyhow::Result<Vec<String>> {
    let body = client.get(url).send().await?.bytes().await?;
    let feed: Feed = parser::parse(&body[..])?;
    let again = fr::parser::parse(body.as_ref())?;
    let with_base = feed_rs::parser::parse_with_uri(body.as_ref(), Some(url))?;
    Ok(feed.entries.into_iter().filter_map(|e| e.title.map(|t| t.content)).collect())
}

// rss: a channel read from a downloaded response, and parsed from its text.
pub async fn channel(url: &str) -> anyhow::Result<Vec<Item>> {
    let content = reqwest::get(url).await?.bytes().await?;
    let ch = Channel::read_from(&content[..])?;
    let text = reqwest::get(url).await?.text().await?;
    let parsed = text.parse::<Channel>()?;
    let by_alias = rs_feed::Channel::read_from(&content[..])?;
    let from_str = Channel::from_str(&text)?;
    Ok(ch.items().to_vec())
}

// atom_syndication: an Atom feed, imported under another name.
pub fn atom(body: &[u8], text: &str) -> anyhow::Result<()> {
    let feed = AtomFeed::read_from(body)?;
    let other = text
        .parse::<atom_syndication::Feed>()?;
    let either = text.parse::<syndication::Feed>()?;
    let by_alias = atom::Feed::read_from(body)?;
    let any = text.parse::<synd::Feed>()?;
    Ok(())
}
