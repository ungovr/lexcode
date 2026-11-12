# lexcode-expect: 4
# Verifying credentials a person presents from a digital identity wallet.

# An OpenID4VP verifier: build a request for a credential, read what the wallet returns.
class WalletVerificationsController < ApplicationController
  def create
    created = verifier.create_request(
      dcql_query: { "credentials" => [{ "id" => "pid", "format" => "dc+sd-jwt" }] },
      response_mode: "direct_post.jwt"
    )
    render json: { url: created.url, session_id: created.session_id }
  end

  def show
    result = verifier.fetch_response(params[:id], response_code: params[:response_code])
    render json: { claims: result&.claims }
  end

  private

  def verifier
    @verifier ||= OpenID4VP::Verifier.new(
      client_id: "x509_san_dns:#{ENV.fetch('VERIFIER_HOST')}",
      response_uri: wallet_response_url,
      trust: { sd_jwt_issuer_keys: ->(iss, _header) { IssuerKeys.for(iss) } }
    )
  end
end

# Verifying an SD-JWT credential on its own.
class CredentialPresentationCheck
  def initialize(issuer_key)
    @verifier = SDJWT::Verifier.new(
      algorithms: ["ES256"],
      key_resolver: ->(_iss, _header) { issuer_key },
      required_claims: ["iss", "exp"]
    )
  end

  def call(presentation)
    @verifier.verify(presentation)
  end
end

# The compatibility spelling, and the same call with a leading scope operator.
legacy = SdJwt::Verifier.new(algorithms: ["ES256"])
scoped = ::OpenID4VP::Verifier.new(client_id: "redirect_uri:https://example.org/cb")
