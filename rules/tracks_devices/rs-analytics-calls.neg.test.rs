// lexcode-expect: 0
use std::collections::HashMap;
use std::sync::atomic::{AtomicU64, Ordering};

// The app's own HttpClient and Event, with no analytics crate imported.
pub struct HttpClient {
    base: String,
}

impl Default for HttpClient {
    fn default() -> Self {
        HttpClient { base: "http://localhost:8080".to_owned() }
    }
}

pub struct Event {
    pub name: String,
    pub at: u64,
}

impl Event {
    pub fn new(name: &str, at: u64) -> Self {
        Event { name: name.to_owned(), at }
    }
}

// An in-process counter of page views: an anonymous total that follows no one.
static VIEWS: AtomicU64 = AtomicU64::new(0);

pub fn page_viewed(path: &str, by_path: &mut HashMap<String, u64>) -> Event {
    VIEWS.fetch_add(1, Ordering::Relaxed);
    *by_path.entry(path.to_owned()).or_insert(0) += 1;
    let _client = HttpClient::default();
    Event::new("page_view", VIEWS.load(Ordering::Relaxed))
}

// A link to the analytics console for the docs page, not a hit sent to it.
pub const ANALYTICS_HELP: &str = "https://analytics.google.com/analytics/web/";
