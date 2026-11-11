# lexcode-expect: 19
require "ferrum"
require "selenium-webdriver"
require "watir"
require "playwright"

# Ferrum drives headless Chrome; here it opens page after page.
class ArticleCollector
  def collect(urls)
    browser = Ferrum::Browser.new
    results = []
    urls.each do |url|
      browser.goto(url)
      results << browser.at_css("article")&.text
    end
    browser.quit
    results
  end

  def collect_links(links)
    links.map { |link| @browser.go_to(link) }
  end
end

# Selenium: a paged listing walked one results page at a time.
class ListingWalker
  def rows
    driver = Selenium::WebDriver.for(:chrome, options: headless_options)
    out = []
    (1..40).each do |n|
      driver.get("https://listings.example.org/results?page=#{n}")
      out.concat(driver.find_elements(css: "li.result").map(&:text))
    end
    driver.quit
    out
  end

  def follow(pages)
    pages.each { |page_url| @driver.navigate.to(page_url) }
  end

  def until_empty(start)
    n = start
    while n < 500
      @driver.get "https://listings.example.org/results?page=#{n}"
      n += 1
    end
  end
end

# Watir and the Playwright client look the same: goto inside a loop.
class WatirPuller
  def pull(urls)
    browser = Watir::Browser.new(:chrome, headless: true)
    urls.each { |u| browser.goto u }
  end
end

class PlaywrightPuller
  def pull(urls)
    Playwright.create(playwright_cli_executable_path: "npx playwright") do |playwright|
      playwright.chromium.launch(headless: true) do |browser|
        page = browser.new_page
        for url in urls do
          page.goto(url)
        end
      end
    end
  end
end

# Capybara with Cuprite visiting another site's absolute URLs.
class CupriteCrawler
  def crawl
    Capybara.current_driver = :cuprite
    loop do
      visit("https://directory.example.org/page/#{@n}")
      break if page.has_no_css?("li.entry")
      @n += 1
    end
  end

  def crawl_known(urls)
    urls.each { |u| page.visit("https://www.example.org/#{u}") }
    3.times { visit "https://www.example.org/archive" }
  end
end

# Shapes the anchor must admit: a leading-dot chain, a trailing dot and safe navigation.
class ChainShapesBrowser
  def run(urls)
    urls.each do |url|
      @driver&.get(url)
      @driver
        .get(url)
      @driver.
        get url
      @driver
        .navigate
        .to(url)
      @driver&.navigate&.to(url)
    end
  end
end

# Shapes the anchor must also admit: an empty () after a no-arg method, a comment line or a
# backslash between the two tokens, and (schema, Mailchimp) text after or far from the key.
class ResidualShapesBrowser
  def run(urls)
    urls.each do |url|
      @driver.navigate().to(url)
      @driver # headless Chrome
        .get(url)
      @driver \
        .get(url)
      @driver.navigate # follow
        .to(url)
    end
  end
end
