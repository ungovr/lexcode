# lexcode-expect: 3
import feedparser

SOURCES = [
    {"name": "Example Times", "url": "https://www.example-times.com/rss/world.xml"},
    {"name": "Example Gazette", "url": "https://gazette.example.org/feed.atom"},
]


def refresh_headlines(store):
    # Reads each publisher's feed and stores the headline, link and a short summary.
    for source in SOURCES:
        parsed = feedparser.parse(source["url"])
        for entry in parsed.entries:
            store.upsert(link=entry.link, title=entry.title, summary=entry.get("summary", "")[:240])


def one_feed(store):
    parsed = feedparser.parse("https://www.example-times.com/rss/science.xml")
    return [{"title": e.title, "link": e.link} for e in parsed.entries]


def from_config(feed_url):
    data = feedparser.parse(feed_url, agent="newsdesk/1.0")
    return data.entries
