# lexcode-expect: 2
import asyncio

from crawlee.crawlers import BeautifulSoupCrawler, BeautifulSoupCrawlingContext, PlaywrightCrawler


async def crawl_blog():
    crawler = BeautifulSoupCrawler(max_requests_per_crawl=200)

    @crawler.router.default_handler
    async def handler(context: BeautifulSoupCrawlingContext) -> None:
        await context.push_data({"url": context.request.url, "title": context.soup.title.string})
        await context.enqueue_links()

    await crawler.run(["https://blog.example.org/"])


async def crawl_rendered(urls):
    browser_crawler = PlaywrightCrawler(headless=True)
    await browser_crawler.add_requests(urls)
    return browser_crawler


asyncio.run(crawl_blog())
