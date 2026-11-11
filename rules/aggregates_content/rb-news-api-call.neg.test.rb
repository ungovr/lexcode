# lexcode-expect: 0
require "net/http"
require "httparty"
require "json"

class OwnPosts
  # The project's own news posts, served from its own API on loopback.
  def latest
    JSON.parse(Net::HTTP.get(URI("http://localhost:3000/api/news")))
  end

  def from_own_host
    HTTParty.get("https://app.example.org/api/news", timeout: 5).parsed_response
  end
end

class Rates
  # A single documented partner API call for something other than news content.
  def latest
    JSON.parse(Net::HTTP.get(URI("https://api.exchangerate.host/latest?base=USD")))
  end

  def weather(city)
    HTTParty.get("https://api.openweathermap.org/data/2.5/weather", query: { q: city })
  end
end

class Catalog
  # Method names that sit near the news client's, on the project's own classes.
  def get_top_selling
    %w[a b]
  end

  def get_everything_on_sale
    %w[c d]
  end
end

# A comment that points at the docs, with no URL in a string:
# see newsapi.org/v2 for how the old integration worked.
def write_latest(posts, path)
  File.write(path, JSON.generate(posts))
end
