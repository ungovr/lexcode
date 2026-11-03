# lexcode-expect: 0
"""Code that fetches over HTTP without crawling sites the operator does not run."""
import os
import sqlite3

import requests

API = os.environ.get("INTERNAL_API", "http://localhost:8000")


class Spider:
    # A class that happens to be called Spider, in a game, with no crawl in it.
    start_urls = ["level-one", "level-two"]

    def __init__(self, legs=8):
        self.legs = legs


class Router(Base):
    start_urls = ["/home", "/about"]


def own_items(item_ids):
    # Calls the project's own API, one request per id. The URL is built, not held in a list.
    out = []
    for item_id in item_ids:
        reply = requests.get(f"{API}/api/items/{item_id}", timeout=5)
        reply.raise_for_status()
        out.append(reply.json())
    return out


def health():
    return requests.get("http://localhost:8000/health", timeout=2).status_code


def exchange_rate(currency):
    # One documented partner API call, not in a loop.
    reply = requests.get("https://api.exchangerate.host/latest", params={"base": currency}, timeout=10)
    return reply.json()["rates"]


def cached(cache, keys):
    # dict-style .get with loop values is not an HTTP fetch.
    return [cache.get(key) for key in keys]


def load_rows(path):
    db = sqlite3.connect(path)
    for (name,) in db.execute("select name from sites"):
        print(name)
