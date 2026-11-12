# lexcode-expect: 8
require "net/http"

# Calling an identity-verification vendor's HTTP API directly.
class PersonaInquiries
  BASE = "https://withpersona.com".freeze

  def create(reference_id)
    Faraday.post("https://api.withpersona.com/api/v1/inquiries") do |req|
      req.headers["Authorization"] = "Bearer #{ENV.fetch('PERSONA_KEY')}"
      req.body = { data: { attributes: { "reference-id" => reference_id } } }.to_json
    end
  end
end

class VeriffSessions
  def connection
    @connection ||= Faraday.new(url: "https://stationapi.veriff.com/v1") do |f|
      f.request :json
      f.response :json
    end
  end

  def decision(id)
    connection.get("sessions/#{id}/decision")
  end
end

class OnfidoChecks
  def check(id)
    HTTParty.get("https://api.eu.onfido.com/v3.6/checks/#{id}", headers: auth_headers)
  end

  def create_check(payload)
    RestClient.post("https://api.onfido.com/v3.6/checks", payload.to_json, auth_headers)
  end
end

class JumioAccounts
  def create
    uri = URI("https://account.amer-1.jumio.ai/api/v1/accounts")
    Net::HTTP.post(uri, body.to_json, "Content-Type" => "application/json")
  end
end

class SumsubApplicants
  def fetch(id)
    http.get("https://api.sumsub.com/resources/applicants/#{id}/one")
  end

  def http
    @http ||= Faraday.new
  end
end

class YotiSessions
  def create
    HTTP.auth("Bearer #{ENV.fetch('YOTI_TOKEN')}").post("https://api.yoti.com/idverify/v1/sessions", json: {})
  end
end

class IdnowIdents
  def start(txn)
    client.put("https://gateway.idnow.io/api/v1/acme/identifications/#{txn}/start")
  end
end
