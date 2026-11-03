# lexcode-expect: 4
import scrapy
from scrapy import Spider
from scrapy.spiders import CrawlSpider, SitemapSpider


class ListingSpider(scrapy.Spider):
    # A spider with start URLs follows pages on sites the operator does not run.
    name = "listings"
    start_urls = ["https://listings.example.org/for-sale"]

    def parse(self, response):
        for row in response.css("div.listing"):
            yield {"title": row.css("a::text").get(), "price": row.css(".price::text").get()}
        next_page = response.css("a.next::attr(href)").get()
        if next_page:
            yield response.follow(next_page, self.parse)


class ArticleSpider(Spider):
    # start_requests is the other way to seed a crawl.
    name = "articles"

    def start_requests(self):
        for section in ("politics", "science"):
            yield scrapy.Request(f"https://news.example.net/{section}", callback=self.parse)

    def parse(self, response):
        yield {"url": response.url, "html": response.text}


class SiteSpider(CrawlSpider):
    name = "site"
    allowed_domains = ["docs.example.com"]
    start_urls = ["https://docs.example.com/"]


class MapSpider(SitemapSpider):
    name = "map"
    sitemap_urls = ["https://store.example.com/sitemap.xml"]

    def parse(self, response):
        yield {"url": response.url}
