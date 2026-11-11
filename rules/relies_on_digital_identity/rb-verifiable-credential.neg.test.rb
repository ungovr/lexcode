# lexcode-expect: 0
# "Credentials" and "verify" here mean a username and password or a signed
# session token, not a verifiable credential from a person's wallet.

class CredentialsVerifier
  def verify_credentials(email, password)
    user = User.find_by(email: email)
    user && BCrypt::Password.new(user.password_digest) == password
  end
end

class TokenVerifier
  def call(token)
    JWT.decode(token, Rails.application.secret_key_base, true, algorithm: "HS256")
  rescue JWT::DecodeError
    nil
  end
end

class Verifier
  def initialize(session)
    @session = session
  end

  def verify(presentation)
    @session && presentation.present?
  end
end

# The app's own SD-JWT-shaped names, and the holder side of a wallet exchange.
module SDJWT
  class Config
    def self.default
      new
    end
  end
end

config = SDJWT::Config.default
wallet = OpenID4VP::Wallet.new(metadata: wallet_metadata)
http = Faraday.new(url: "https://api.example.org")
