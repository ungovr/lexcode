// lexcode-expect: 4
use webpage::{Webpage, WebpageOptions};
use webpage as wp;
use opengraph::{scrape, Object};
use opengraph as ogp;

// webpage downloads the page and reads its title, description and Open Graph tags.
pub fn preview(url: &str) -> anyhow::Result<Option<String>> {
    let info = Webpage::from_url("https://www.rust-lang.org/en-US/", WebpageOptions::default())?;
    let posted = wp::Webpage::from_url(url, wp::WebpageOptions::default())?;
    Ok(posted.html.title)
}

// opengraph downloads the page and reads its Open Graph object.
pub fn card(url: &str) -> anyhow::Result<()> {
    let og: Object = scrape(url, Default::default())?;
    let fixed = ogp::scrape(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        Default::default(),
    )?;
    Ok(())
}
