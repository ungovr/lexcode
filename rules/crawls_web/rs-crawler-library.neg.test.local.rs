// lexcode-expect: 0
use spider::website::Website;

// The spider crate pointed at the app's own development server: a loopback address is not
// another site.
pub async fn self_check() {
    let mut site = Website::new("http://localhost:8080");
    site.crawl().await;
    let mut again = Website::new("http://127.0.0.1:3000/docs");
    again.scrape().await;
}
