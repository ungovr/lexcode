# lexcode-expect: 6
require "net/http"
require "httparty"
require "faraday"
require "news-api"

# A Rails service that shows other publishers' headlines and snippets in the app's own feed.
class TopStories
  NEWS_ENDPOINT = "https://newsapi.org/v2/top-headlines".freeze

  def fetch(topic)
    uri = URI(NEWS_ENDPOINT)
    uri.query = URI.encode_www_form(category: topic, language: "en", apiKey: ENV.fetch("NEWSAPI_KEY"))
    JSON.parse(Net::HTTP.get(uri))["articles"].map do |a|
      { title: a["title"], url: a["url"], snippet: a["description"] }
    end
  end
end

class GuardianSearch
  def search(term)
    HTTParty.get("https://content.guardianapis.com/search", query: { q: term, "api-key": ENV["GUARDIAN_KEY"] })
  end
end

class NytTopStories
  def conn
    Faraday.new(url: "https://api.nytimes.com/svc/topstories/v2")
  end
end

class GnewsHeadlines
  def latest
    Net::HTTP.get_response(URI.parse("https://gnews.io/api/v4/top-headlines?lang=en&token=#{ENV['GNEWS_TOKEN']}"))
  end
end

# The newsapi gem's client.
class ClientHeadlines
  def initialize
    @newsapi = News.new(ENV["NEWSAPI_KEY"])
  end

  def headlines
    @newsapi.get_top_headlines(country: "us")
  end

  def everything
    @newsapi.get_everything(q: "housing", sortBy: "publishedAt")
  end
end
