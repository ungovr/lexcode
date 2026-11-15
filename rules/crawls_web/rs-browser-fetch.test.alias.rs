// lexcode-expect: 4
// Each browser crate through an alias, and one through a `pub(crate) use` line.
use headless_chrome as hc;
use fantoccini as fc;
use thirtyfour as tf;
pub(crate) use chromiumoxide::Page;

pub fn tab(url: &str) -> anyhow::Result<()> {
    let browser = hc::Browser::default()?;
    let tab = browser.new_tab()?;
    tab.navigate_to(url)?;
    Ok(())
}

pub async fn drive(client: &fc::Client, driver: &tf::WebDriver, page: &Page, url: &str) -> anyhow::Result<()> {
    client.goto(url).await?;
    driver.goto(url).await?;
    page.goto(url).await?;
    Ok(())
}
