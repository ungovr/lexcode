// lexcode-expect: 2
// The browser crates named by their paths, with no `use` line for them.

pub fn by_path(url: &str) -> anyhow::Result<()> {
    let browser = headless_chrome::Browser::default()?;
    let tab = browser.new_tab()?;
    tab.navigate_to(url)?;
    Ok(())
}

pub async fn oxide(url: &str) -> anyhow::Result<()> {
    let (browser, _handler) = chromiumoxide::Browser::launch(chromiumoxide::BrowserConfig::builder().build()?).await?;
    let page = browser.new_page(url).await?;
    Ok(())
}
