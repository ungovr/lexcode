// lexcode-expect: 10
use webpage::{OpengraphObject, Webpage, WebpageOptions, HTML};
use webpage as wp;
use opengraph::{extract, scrape};
use opengraph as ogp;
use scraper::{Html, Selector};
use scraper as sc;

pub struct Preview {
    pub title: Option<String>,
    pub description: Option<String>,
    pub image: Option<String>,
}

// A preview card for a posted link: the page's title, description and Open Graph image, read
// from HTML the app fetched (webpage's HTML), through a grouped `use` and the crate's alias.
pub fn from_fetched(html: &[u8], url: &str) -> anyhow::Result<Preview> {
    let text = String::from_utf8_lossy(html);
    let page = HTML::from_string(text.to_string(), Some(url.to_string()))?;
    let again = wp::HTML::from_string(text.into_owned(), None)?;
    Ok(Preview {
        title: page.opengraph.properties.get("title").cloned().or(page.title),
        description: page.description,
        image: page.opengraph.images.first().map(|i: &OpengraphObject| i.url.clone()),
    })
}

// webpage and opengraph fetching the page themselves.
pub fn fetch_and_read(url: &str, body: &str) -> anyhow::Result<()> {
    let info = Webpage::from_url(url, WebpageOptions::default())?;
    let by_alias = wp::Webpage::from_url(url, wp::WebpageOptions::default())?;
    let og = scrape(url, Default::default())?;
    let og2 = ogp::extract(&mut body.as_bytes(), Default::default())?;
    let og3 = extract(&mut body.as_bytes(), Default::default())?;
    Ok(())
}

// scraper selectors that read a page's Open Graph and Twitter card tags.
pub fn card(doc: &Html) -> Preview {
    let og_title = Selector::parse(r#"meta[property="og:title"]"#).unwrap();
    let og_image = sc::Selector::parse("meta[property='og:image']").unwrap();
    let tw_desc = Selector::parse(
        "meta[name=\"twitter:description\"]",
    )
    .unwrap();
    Preview { title: None, description: None, image: None }
}
