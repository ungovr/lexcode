// lexcode-expect: 0
// A file that names no scraping service's API: the app's own `crawl_url` and `scrape_url`
// methods, links to the services' marketing pages shown to a person, and the app's own proxy.
// A comment that names the SDK does not count:
// use firecrawl::FirecrawlApp;  (replaced by Indexer)

pub struct Indexer;

impl Indexer {
    pub async fn crawl_url(&self, url: &str) -> usize {
        url.len()
    }
    pub async fn scrape_url(&self, url: &str, _opts: Option<u8>) -> usize {
        url.len()
    }
}

pub async fn about(ix: &Indexer) -> Vec<&'static str> {
    ix.crawl_url("https://docs.example.com").await;
    ix.scrape_url("https://docs.example.com/faq", None).await;
    vec![
        "https://www.firecrawl.dev/pricing",
        "https://www.scrapingbee.com/blog/",
        "https://jina.ai/reader",
        "http://proxy.internal.example.com:3128",
        "https://www.browserless.io/pricing",
        "https://docs.browserless.io/",
        "billing@proxy.zyte.com",
    ]
}
