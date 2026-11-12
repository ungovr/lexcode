# lexcode-expect: 0
require "net/http"

# The app's own API, and ordinary third-party APIs that check nobody's identity.
class Clients
  def profile(id)
    Faraday.get("https://api.example.org/v1/users/#{id}")
  end

  def charge(body)
    HTTParty.post("https://api.stripe.com/v1/payment_intents", body: body)
  end

  def weather(city)
    RestClient.get("https://api.weather.example.net/v2/forecast?city=#{city}")
  end

  def own_session
    uri = URI("https://auth.example.org/api/v1/session")
    Net::HTTP.get(uri)
  end
end

# A link to a vendor's marketing or documentation page is not an API call.
class Links
  PRICING = "https://www.onfido.com/pricing".freeze

  def open_pricing
    Net::HTTP.get(URI("https://www.onfido.com/pricing"))
  end

  def read_docs
    Faraday.get("https://yoti.com/blog/age-estimation-explained")
  end
end

# A log line and a comment name a vendor's API but call nothing.
Rails.logger.info "we no longer use https://api.onfido.com/v3.6/checks"
puts "docs: https://documentation.onfido.com/"
NOTE = "ask Veriff about https://stationapi.veriff.com/v1/sessions"
