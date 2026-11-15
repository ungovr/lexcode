// lexcode-expect: 7
use headless_chrome::{Browser, LaunchOptions};
use chromiumoxide as cdp;
use fantoccini::{ClientBuilder, Locator};
use thirtyfour::prelude::*;
use futures::StreamExt;

// headless_chrome, imported through a grouped `use`: a tab opened on a page of another site.
pub fn listing() -> anyhow::Result<String> {
    let browser = Browser::new(LaunchOptions::default_builder().build()?)?;
    let tab = browser.new_tab()?;
    tab.navigate_to("https://www.example-shop.com/deals")?;
    tab.wait_until_navigated()?;
    Ok(tab.get_content()?)
}

// chromiumoxide through the crate's alias: a page opened on an address, then another.
pub async fn screenshot(url: &str) -> anyhow::Result<()> {
    let (mut browser, mut handler) = cdp::Browser::launch(cdp::BrowserConfig::builder().build()?).await?;
    tokio::spawn(async move { while let Some(_) = handler.next().await {} });
    let page = browser.new_page("https://news.example.org/").await?;
    page.goto(url).await?;
    let other = browser
        .new_page(url)
        .await?;
    Ok(())
}

// fantoccini, driven through a local WebDriver to a page of another site.
pub async fn wiki(term: &str) -> anyhow::Result<()> {
    let c = ClientBuilder::native().connect("http://localhost:4444").await?;
    c.goto("https://en.wikipedia.org/wiki/Foobar").await?;
    c.goto(&format!("https://en.wikipedia.org/wiki/{term}")).await?;
    c.find(Locator::Css(".mw-search")).await?;
    Ok(())
}

// thirtyfour, the WebDriver client.
pub async fn search(driver: &WebDriver, target: String) -> WebDriverResult<()> {
    driver.goto(target).await?;
    Ok(())
}
