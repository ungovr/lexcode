# lexcode-expect: 19
require "net/http"
require "open-uri"
require "faraday"
require "httparty"

# A job that walks a list of pages held in a variable and downloads each one.
class RefreshListingsJob < ApplicationJob
  def perform(urls)
    urls.each do |url|
      response = Net::HTTP.get_response(URI.parse(url))
      Listing.import(response.body) if response.is_a?(Net::HTTPSuccess)
    end
  end
end

class PagePuller
  def pull_all(urls)
    urls.map { |url| Net::HTTP.get(URI(url)) }
  end

  def pull_with_headers(links)
    links.map do |link|
      HTTParty.get(link, headers: { "User-Agent" => "pricewatch/1.0" })
    end
  end

  def pull_faraday(urls)
    urls.each_with_index do |u, i|
      Faraday.get(u)
      @conn.get(u)
    end
  end

  def pull_rest_client(pages)
    pages.each { |page_url| RestClient.get(page_url) }
  end

  def head_each(urls)
    urls.each { |u| Typhoeus.head(u, followlocation: true) }
  end

  def pull_http_rb(urls)
    urls.flat_map { |u| HTTP.get(u).to_s.lines }
  end

  def open_each(urls)
    for url in urls
      body = URI.open(url).read
      puts body.size
    end
  end

  def open_uri_style(feed_urls)
    feed_urls.map { |feed_url| URI.parse(feed_url).open.read }
  end

  def parsed_first(urls)
    urls.each do |url|
      uri = URI.parse(url)
      Net::HTTP.get_response(uri)
    end
  end

  def capitalised_receiver(urls)
    urls.each { |url| ApiClient.get(url) }
  end

  def parenless_open(feed_urls)
    feed_urls.each do |feed_url|
      open feed_url
    end
  end

  def in_parallel(urls)
    Parallel.map(urls, in_threads: 4) { |u| HTTParty.get(u) }
  end
end

# Shapes the anchor must admit: a leading-dot chain, a trailing dot and safe navigation.
class ChainShapesFetch
  def run(urls)
    urls.each do |url|
      URI&.parse(url)&.open&.read
      URI.parse(url).
        open.
        read
      URI.parse(url)
        .open
        .read
    end
  end
end

# Shapes the anchor must also admit: an empty () after a no-arg method, a comment line or a
# backslash between the two tokens, and (schema, Mailchimp) text after or far from the key.
class ResidualShapesFetch
  def run(urls)
    urls.each do |url|
      URI.parse(url) # the feed
        .read
      URI.parse(url) \
        .open
    end
  end
end
