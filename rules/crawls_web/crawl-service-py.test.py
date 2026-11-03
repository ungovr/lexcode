# lexcode-expect: 3
from crawl4ai import AsyncWebCrawler
from firecrawl import FirecrawlApp

app = FirecrawlApp(api_key="fc-key-from-env")


def mirror_docs():
    # Asks the scraping service to crawl a whole site and return every page.
    return app.crawl_url("https://docs.example.com", params={"limit": 200})


def site_map(site):
    return app.map_url(site)


async def many(urls):
    async with AsyncWebCrawler() as crawler:
        return await crawler.arun_many(urls)
