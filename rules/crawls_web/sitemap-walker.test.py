# lexcode-expect: 3
import re
from xml.etree import ElementTree

import requests
from bs4 import BeautifulSoup

NS = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}


def walk_etree(sitemap_url):
    root = ElementTree.fromstring(requests.get(sitemap_url, timeout=20).content)
    for loc in root.findall(".//sm:loc", NS):
        page = requests.get(loc.text, timeout=10)
        yield loc.text, page.text


def walk_soup(sitemap_url):
    soup = BeautifulSoup(requests.get(sitemap_url, timeout=20).text, "xml")
    urls = [tag.text for tag in soup.find_all("loc")]
    for u in urls:
        requests.get(u, timeout=10)


def walk_regex(xml_text, session):
    for found in re.findall(r"<loc>(.*?)</loc>", xml_text):
        session.get(found)
