# lexcode-expect: 3
from playwright.sync_api import sync_playwright
from selenium import webdriver


def collect_articles(urls):
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        for url in urls:
            page.goto(url, wait_until="domcontentloaded")
            results.append(page.inner_text("article"))
        browser.close()
    return results


def paged_listing():
    driver = webdriver.Chrome()
    rows = []
    for n in range(1, 40):
        driver.get(f"https://listings.example.org/results?page={n}")
        rows.extend(el.text for el in driver.find_elements("css selector", "li.result"))
    driver.quit()
    return rows


async def collect_async(async_playwright, links):
    async with async_playwright() as p:
        browser = await p.firefox.launch()
        tab = await browser.new_page()
        async for link in links:
            await tab.goto(link)
