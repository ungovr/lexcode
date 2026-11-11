# lexcode-expect: 7
require "mechanize"
require "kimurai"
require "vessel"
require "wombat"
require "spidr"

# A Kimurai spider: it starts from a list of URLs and parses each response.
class CouncilAgendaSpider < Kimurai::Base
  @name = "council_agendas"
  @engine = :mechanize
  @start_urls = ["https://www.example-council.org/agendas"]

  def parse(response, url:, data: {})
    response.xpath("//a[@class='agenda']").each do |link|
      Agenda.create!(title: link.text, href: absolute_url(link[:href], base: url))
    end
  end
end

# A Vessel crawler: it names a domain and the URLs to begin from.
class BlogCrawler < Vessel::Cargo
  domain "blog.example.org"
  start_urls "https://blog.example.org/archive"

  def parse
    css("article h2 a").each { |a| request(url: absolute_url(a[:href]), handler: :post) }
  end
end

# Wombat describes a page by selectors and crawls it.
class ProductPage
  include Wombat::Crawler

  base_url "https://shop.example.org"
  path "/products"
  name "css=h1"
end

def headlines
  Wombat.crawl do
    base_url "https://news.example.org"
    path "/"
    headline "css=h1"
  end
end

def agent
  Spidr::Agent.new(delay: 1, user_agent: "pricewatch/1.0")
end

# Mechanize is a scriptable browser: it fetches pages, follows links and submits forms.
class PortalReader
  def initialize
    @agent = Mechanize.new
    @agent.user_agent_alias = "Mac Safari"
  end

  def titles(url)
    @agent.get(url).search("h1").map(&:text)
  end

  def one_off(url)
    Mechanize.start { |agent| agent.get(url).title }
  end
end
