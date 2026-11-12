# lexcode-expect: 6
require "net/http"
require "feedjira"
require "httparty"

# A job that reads other publishers' feeds and stores the headline, link and a short summary.
class RefreshHeadlinesJob < ApplicationJob
  SOURCES = {
    "Example Times" => "https://www.example-times.com/rss/world.xml",
    "Example Gazette" => "https://gazette.example.org/feed.atom"
  }.freeze

  def perform
    SOURCES.each do |name, url|
      xml = HTTParty.get(url).body
      feed = Feedjira.parse(xml)
      feed.entries.each do |entry|
        Headline.upsert(source: name, link: entry.url, title: entry.title, summary: entry.summary.to_s[0, 240])
      end
    end
  end
end

class DirectFetch
  def headlines(url)
    Feedjira.parse(Net::HTTP.get(URI(url))).entries.map(&:title)
  end

  def from_response(response)
    Feedjira.parse(response.body)
  end

  def from_faraday(url)
    Feedjira.parse(Faraday.get(url).body)
  end

  def legacy_class_method(xml)
    Feedjira::Feed.parse(xml)
  end

  def old_name(xml)
    Feedzirra::Feed.parse(xml)
  end
end
