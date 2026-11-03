# lexcode-expect: 0
from playwright.sync_api import sync_playwright
from selenium import webdriver


def render_invoice_pdf(url):
    # One launched browser, one page, no loop: rendering a single document to PDF.
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.goto(url)
        pdf = page.pdf()
        browser.close()
    return pdf


def login_check():
    driver = webdriver.Chrome()
    driver.get("http://localhost:8000/login")
    title = driver.title
    driver.quit()
    return title


def route_titles(page, routes):
    # `page` is handed in by a test runner; nothing here launches a browser.
    titles = []
    for route in routes:
        page.goto("http://localhost:8000" + route)
        titles.append(page.title())
    return titles


def lookup(cache, keys):
    return [cache.get(k) for k in keys]


def shoot_local_pages(port, paths):
    # A launched browser looping over the project's own pages on loopback, to take screenshots.
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        shots = []
        for path in paths:
            page.goto(f"http://127.0.0.1:{port}{path}")
            shots.append(page.screenshot())
        browser.close()
    return shots


def read_rows(driver):
    # .get on a dict read from a page is a dictionary lookup, not a page load.
    rows = driver.execute_script("return window.__rows")
    out = []
    for row in rows:
        out.append(row.get("modified_at"))
    return out
