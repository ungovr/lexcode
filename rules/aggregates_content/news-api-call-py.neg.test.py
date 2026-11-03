# lexcode-expect: 0
import json

import requests


def own_posts():
    # The project's own news posts, served from its own API.
    return requests.get("http://localhost:8000/api/news", timeout=5).json()


def exchange_rate():
    # A single documented partner API call for something other than news content.
    return requests.get("https://api.exchangerate.host/latest", params={"base": "USD"}, timeout=10).json()


class Catalog:
    def get_top_selling(self):
        return ["a", "b"]


def write_latest(posts, path):
    # Writes the project's own posts to disk. No third-party content is read.
    with open(path, "w") as handle:
        json.dump(posts, handle)
