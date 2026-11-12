# lexcode-expect: 12
require "net/http"
require "open-uri"
require "nokogiri"
require "httparty"
require "faraday"

# A scraper that reads listings straight off another site's pages.
class ListingScraper
  START = "https://www.example-listings.com/search?page=1".freeze

  def first_page
    doc = Nokogiri::HTML(URI.open(START))
    doc.css("li.result").map { |li| li.at_css("a")["href"] }
  end

  def page(url)
    Nokogiri::HTML(URI.open(url).read)
  end

  def legacy_open(url)
    Nokogiri::HTML(open(url))
  end

  def html5(url)
    Nokogiri::HTML5(URI.open(url, "User-Agent" => "pricewatch/1.0"))
  end

  def via_httparty(url)
    Nokogiri::HTML.parse(HTTParty.get(url).body)
  end

  def via_net_http(url)
    Nokogiri::HTML(Net::HTTP.get(URI(url)))
  end

  def via_net_http_parse(url)
    Nokogiri::HTML(Net::HTTP.get(URI.parse(url)))
  end

  def via_faraday(url)
    Nokogiri::HTML(Faraday.get(url).body)
  end

  def via_rest_client(url)
    Nokogiri::HTML(RestClient.get(url))
  end

  def via_connection(url)
    Nokogiri::HTML(@conn.get(url).body)
  end

  def via_http_rb(url)
    Nokogiri::HTML(HTTP.get(url).to_s)
  end

  def via_uri_open_method(url)
    Nokogiri::HTML(URI.parse(url).open)
  end
end
