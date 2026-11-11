# lexcode-expect: 0
require "ferrum"
require "selenium-webdriver"

class InvoicePdf
  # One browser, one page, no loop: rendering a single document to PDF.
  def render(url)
    browser = Ferrum::Browser.new
    browser.goto(url)
    browser.pdf(path: "/tmp/invoice.pdf")
  ensure
    browser&.quit
  end
end

class LoginCheck
  def title
    driver = Selenium::WebDriver.for(:chrome)
    driver.get("http://localhost:3000/login")
    driver.title
  ensure
    driver&.quit
  end
end

class OwnScreenshots
  # A launched browser looping over the project's own pages on loopback, to take screenshots.
  def shoot(paths)
    browser = Ferrum::Browser.new
    paths.each do |path|
      browser.goto("http://127.0.0.1:3000#{path}")
      browser.screenshot(path: "tmp/shots#{path.tr('/', '_')}.png")
    end
  end

  def shoot_with_driver(paths)
    driver = Selenium::WebDriver.for(:chrome)
    paths.each { |p| driver.get("http://localhost:3000#{p}") }
    paths.each { |p| driver.navigate.to("http://localhost:3000#{p}") }
  end
end

class RouteWalker
  # Capybara walks the project's own routes: relative paths and route helpers.
  def walk(users)
    users.each do |user|
      visit user_path(user)
      visit "/users/#{user.id}/settings"
    end
    5.times { visit "/dashboard" }
  end

  def walk_local(slugs)
    slugs.each { |s| page.visit("http://localhost:3000/#{s}") }
  end
end

class Lookups
  # .get and .goto on things that are not browsers.
  def read_rows(rows)
    rows.map { |row| row.get("modified_at") }
  end

  def cached(keys)
    keys.each { |k| cache.get(k) }
    keys.each { |k| redis.get(k) }
  end

  def menu(items)
    items.each { |item| player.goto_next(item) }
  end
end
