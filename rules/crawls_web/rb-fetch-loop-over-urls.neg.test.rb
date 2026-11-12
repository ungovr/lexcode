# lexcode-expect: 0
require "net/http"
require "open-uri"
require "faraday"
require "httparty"

API = ENV.fetch("INTERNAL_API", "http://localhost:3000")

class OwnItems
  # The project's own API: the URL is built from a base and an id, the loop variable is an id.
  def pull(item_ids)
    item_ids.map do |item_id|
      HTTParty.get("#{API}/api/items/#{item_id}", timeout: 5).parsed_response
    end
  end

  def pull_with_client(item_ids)
    conn = Faraday.new(url: "http://127.0.0.1:3000")
    item_ids.each { |i| conn.get("/api/items/" + i.to_s) }
  end

  def pull_net_http(item_ids)
    item_ids.each do |id|
      Net::HTTP.get(URI("http://localhost:3000/api/items/#{id}"))
    end
  end
end

class Reports
  # A single documented partner API call, not in a loop.
  def repo_info
    JSON.parse(Net::HTTP.get(URI("https://api.github.com/repos/rails/rails")))
  end

  def single_download
    URI.open("https://api.exchangerate.host/latest").read
  end

  # .get with the loop value on a cache or key-value store is a lookup, not a fetch.
  def cached(urls)
    urls.map { |u| redis.get(u) }
  end

  def cached_client(urls)
    urls.each { |u| redis_client.get(u) }
    urls.each { |u| Rails.cache.read(u) }
    urls.map { |u| settings.fetch(u) }
  end

  # Local files opened with a loop variable.
  def read_files(paths)
    paths.each do |path|
      File.open(path) { |f| f.read }
      open(path).read
    end
  end

  # Loop variables that are only parsed or printed.
  def normalise(urls)
    urls.map do |url|
      puts url
      URI.parse(url).host
    end
  end

  def redis
    @redis ||= Redis.new
  end
end
