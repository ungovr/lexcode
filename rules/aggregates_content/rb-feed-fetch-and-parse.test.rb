# lexcode-expect: 10
require "rss"
require "open-uri"
require "net/http"
require "simple-rss"
require "feedjira"

# A reader that pulls headlines out of other publishers' feeds and keeps the links.
class FeedReader
  FEEDS = %w[
    https://www.example-times.com/rss/world.xml
    https://gazette.example.org/feed.atom
  ].freeze

  # The stdlib parser, given a feed URL or an open-uri handle.
  def stdlib_url
    RSS::Parser.parse("https://www.example-times.com/rss/science.xml", false)
  end

  def stdlib_open(url)
    RSS::Parser.parse(URI.open(url), false)
  end

  def stdlib_open_literal
    RSS::Parser.parse(URI.open("https://gazette.example.org/feed.atom"), false)
  end

  def stdlib_net_http(url)
    RSS::Parser.parse(Net::HTTP.get(URI(url)), false)
  end

  def stdlib_uri_method(url)
    RSS::Parser.parse(URI.parse(url).open, false)
  end

  def stdlib_legacy_open(feed_url)
    RSS::Parser.parse(open(feed_url), false)
  end

  def simple_rss(url)
    SimpleRSS.parse(URI.open(url))
  end

  # Feedjira's older fetching API.
  def fetch_one(url)
    Feedjira::Feed.fetch_and_parse(url)
  end

  def fetch_literal
    Feedjira::Feed.fetch_and_parse("https://www.example-times.com/rss/world.xml")
  end

  def fetch_many
    Feedzirra::Feed.fetch_and_parse(FEEDS)
  end
end
