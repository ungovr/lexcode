# lexcode-expect: 0
require "net/http"
require "open-uri"
require "nokogiri"
require "httparty"

class OwnMarkup
  # Nokogiri over text the project already holds: no page is fetched.
  def titles(html)
    Nokogiri::HTML(html).css("h1").map(&:text)
  end

  def from_disk
    Nokogiri::HTML(File.read(Rails.root.join("public", "404.html")))
  end

  def from_response(response)
    Nokogiri::HTML(response.body).at_css("title")
  end

  def fragment(text)
    Nokogiri::HTML::DocumentFragment.parse(text).text
  end

  def from_local_file(path)
    Nokogiri::HTML(open(path))
  end

  def sanitize(text)
    Nokogiri::HTML5.fragment(text).to_html
  end
end

class OwnSite
  # The project's own server on loopback, to check its rendered pages.
  def home_title
    Nokogiri::HTML(URI.open("http://localhost:3000/")).at_css("title").text
  end

  def about_title
    Nokogiri::HTML(Net::HTTP.get(URI("http://127.0.0.1:3000/about"))).at_css("h1").text
  end

  def pricing
    Nokogiri::HTML(HTTParty.get("http://localhost:3000/pricing").body)
  end
end

class Partner
  # One documented partner API call, parsed as JSON: not a page, not Nokogiri.
  def rate
    JSON.parse(Net::HTTP.get(URI("https://api.exchangerate.host/latest")))
  end

  # One documented partner API call whose answer is XML: Nokogiri.parse reads XML as well as HTML.
  def tracking
    Nokogiri.parse(HTTParty.get("https://api.carrier.example/v1/track.xml").body)
  end

  # Nokogiri XML over a string the project builds itself.
  def own_sitemap(urls)
    builder = Nokogiri::XML::Builder.new { |xml| xml.urlset { urls.each { |u| xml.url { xml.loc u } } } }
    builder.to_xml
  end
end
