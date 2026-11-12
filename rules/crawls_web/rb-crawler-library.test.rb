# lexcode-expect: 8
require "spidr"
require "anemone"

# A crawler job built on Spidr: it follows links across a site and stores each page.
class SiteMirrorJob < ApplicationJob
  def perform(site_url)
    Spidr.site(site_url) do |spider|
      spider.every_page { |page| Page.create!(url: page.url.to_s, body: page.body) }
    end
  end

  def whole_host
    Spidr.host("www.example-council.org", max_depth: 3) do |spider|
      spider.every_html_page { |page| Page.create!(url: page.url.to_s, title: page.title) }
    end
  end

  def from_seed
    Spidr.start_at("https://news.example.org/") do |spider|
      spider.every_url { |url| Rails.logger.info(url) }
    end
  end

  def whole_domain
    Spidr.domain("example-listings.com") { |spider| spider.every_page { |page| index(page) } }
  end
end

# Anemone and its maintained fork Medusa crawl from one or more roots.
class LinkHarvester
  def run(roots)
    Anemone.crawl(roots) do |anemone|
      anemone.on_every_page { |page| Link.import(page.links) }
    end
  end

  def single_root
    Anemone.crawl("https://www.example-store.com/") { |a| a.on_pages_like(%r{/product/}) { |p| index(p) } }
  end

  def via_medusa(root)
    Medusa.crawl(root) { |m| m.on_every_page { |p| index(p) } }
  end

  def via_medusa_literal
    Medusa.crawl("https://archive.example.org/") { |m| m.on_every_page { |p| index(p) } }
  end
end
