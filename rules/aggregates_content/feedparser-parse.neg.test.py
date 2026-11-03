# lexcode-expect: 0
import io
from pathlib import Path

import feedparser
from feedgen.feed import FeedGenerator


def build_own_feed(posts, path):
    # Generates the project's OWN feed from its own posts: a writer, not a reader.
    fg = FeedGenerator()
    fg.title("Our blog")
    fg.link(href="https://blog.example.org/", rel="alternate")
    fg.description("Posts from our blog")
    for post in posts:
        fe = fg.add_entry()
        fe.title(post["title"])
        fe.link(href=f"https://blog.example.org/{post['slug']}")
    fg.rss_file(path)


def read_local_posts():
    # Parses a local file of the project's own posts. No URL is fetched.
    parsed = feedparser.parse("content/posts.xml")
    return [e.title for e in parsed.entries]


def read_local_file_object():
    with open("content/posts.xml", "rb") as handle:
        return feedparser.parse(handle.read()).entries


def read_path_object():
    return feedparser.parse(Path("content") / "posts.xml").entries


def read_in_memory(xml_text):
    return feedparser.parse(io.StringIO(xml_text)).entries


def self_check():
    # The dev server's copy of the project's own feed.
    return feedparser.parse("http://localhost:8000/rss.xml").entries
