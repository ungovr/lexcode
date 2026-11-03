# lexcode-expect: 0
import re
from xml.etree import ElementTree

import requests


def write_sitemap(paths, base):
    # The project generates its OWN sitemap; it lists its pages and fetches nothing.
    urlset = ElementTree.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")
    for path in paths:
        url = ElementTree.SubElement(urlset, "url")
        ElementTree.SubElement(url, "loc").text = base + path
    return ElementTree.tostring(urlset, encoding="unicode")


def count_entries(path):
    # Reads a local sitemap file the project wrote and only counts entries.
    root = ElementTree.parse(path).getroot()
    return len(root.findall(".//{http://www.sitemaps.org/schemas/sitemap/0.9}loc"))


def notify_search_engine(sitemap_url):
    # A single ping with one documented URL.
    return requests.get("https://www.bing.com/ping", params={"sitemap": sitemap_url}, timeout=10)


def lookup_rows(rows, lookup):
    out = []
    for row in re.findall(r"\d+", rows):
        out.append(lookup.get(row))
    return out
