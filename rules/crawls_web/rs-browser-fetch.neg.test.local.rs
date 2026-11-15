// lexcode-expect: 0
use chromiumoxide::{Browser, BrowserConfig};
use fantoccini::ClientBuilder;
use futures::StreamExt;

// A browser rendering the app's own pages to PDF or checking its own dev server: a blank page,
// loopback hosts, file and data addresses, and an address built on the app's own URL.
pub async fn render_invoice(html_path: &str, app_url: &str) -> anyhow::Result<()> {
    let (mut browser, mut handler) = Browser::launch(BrowserConfig::builder().build()?).await?;
    tokio::spawn(async move { while let Some(_) = handler.next().await {} });
    let page = browser.new_page("about:blank").await?;
    page.goto("http://localhost:3000/invoice/42").await?;
    page.goto("file:///tmp/invoice.html").await?;
    page.goto("data:text/html,<h1>Invoice</h1>").await?;
    page.goto(format!("{app_url}/invoice/42")).await?;
    page.goto(app_url).await?;
    Ok(())
}

// Connecting to a local WebDriver server is not opening a page.
pub async fn driver() -> anyhow::Result<()> {
    let c = ClientBuilder::native().connect("http://localhost:4444").await?;
    c.goto("http://127.0.0.1:8080/login").await?;
    c.close().await?;
    Ok(())
}
