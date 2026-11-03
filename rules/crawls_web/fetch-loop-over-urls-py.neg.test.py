# lexcode-expect: 0
import os

import requests
import httpx

API = os.environ.get("INTERNAL_API", "http://localhost:8000")


def own_items(item_ids):
    # The project's own API: the URL is built from a base and an id, the loop variable is an id.
    out = []
    for item_id in item_ids:
        reply = requests.get(f"{API}/api/items/{item_id}", timeout=5)
        out.append(reply.json())
    return out


def own_items_client(item_ids):
    with httpx.Client(base_url="http://127.0.0.1:8000") as client:
        return [client.get("/api/items/" + str(i)).json() for i in item_ids]


def partner_once():
    # A single documented partner API call.
    return requests.get("https://api.github.com/repos/python/cpython", timeout=10).json()


def cache_lookup(cache, urls):
    # .get on a mapping with the loop value is a dictionary lookup, not a fetch.
    return [cache.get(u) for u in urls]


def normalise(urls):
    cleaned = []
    for url in urls:
        cleaned.append(url.strip().lower())
        print(url)
    return cleaned
