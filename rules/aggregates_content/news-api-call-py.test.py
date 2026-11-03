# lexcode-expect: 3
import os

import requests
from newsapi import NewsApiClient

client = NewsApiClient(api_key=os.environ["NEWSAPI_KEY"])


def top_stories(topic):
    # Headlines and snippets from other publishers, shown in the app's own feed.
    reply = requests.get(
        "https://newsapi.org/v2/top-headlines",
        params={"category": topic, "language": "en"},
        headers={"X-Api-Key": os.environ["NEWSAPI_KEY"]},
        timeout=10,
    )
    return [{"title": a["title"], "url": a["url"], "snippet": a["description"]} for a in reply.json()["articles"]]


def via_client():
    headlines = client.get_top_headlines(country="us")
    everything = client.get_everything(q="housing", sort_by="publishedAt")
    return headlines["articles"] + everything["articles"]
