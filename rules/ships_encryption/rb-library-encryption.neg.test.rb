# lexcode-expect: 0
# Hashing, signing, password hashing, random bytes and stock TLS are not
# shipping encryption; neither is the platform's own TLS or an app's own
# class that happens to use the same method names.
require "digest"
require "net/http"
require "openssl"

class Fingerprints
  def digest(text)
    Digest::SHA256.hexdigest(text)
  end

  def sign(body, secret)
    OpenSSL::HMAC.hexdigest("SHA256", secret, body)
  end

  def md(text)
    OpenSSL::Digest.new("SHA256").hexdigest(text)
  end

  def token
    SecureRandom.urlsafe_base64(32)
  end
end

class Passwords
  has_secure_password

  def hash(password)
    BCrypt::Password.create(password)
  end

  def check(hash, password)
    BCrypt::Password.new(hash) == password
  end
end

class Tokens
  def issue(user)
    JWT.encode({ sub: user.id, exp: 1.hour.from_now.to_i }, Rails.application.secret_key_base, "HS256")
  end

  def sign_with_key(data)
    key = OpenSSL::PKey::RSA.new(File.read("private.pem"))
    key.sign(OpenSSL::Digest.new("SHA256"), data)
  end

  def sign_json_jwt(payload, secret)
    JSON::JWT.new(payload).sign(secret, :HS256).to_s
  end

  def message_signer(secret)
    ActiveSupport::MessageVerifier.new(secret)
  end

  def derive(secret)
    ActiveSupport::KeyGenerator.new(secret).generate_key("salt", 32)
  end
end

# Stock HTTPS from the standard library.
class Fetcher
  def get(url)
    uri = URI(url)
    Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.get(uri.request_uri) }
  end

  def context
    ctx = OpenSSL::SSL::SSLContext.new
    ctx.verify_mode = OpenSSL::SSL::VERIFY_PEER
    ctx
  end

  def certificate(pem)
    OpenSSL::X509::Certificate.new(pem)
  end
end

# Cipher errors are exceptions, not ciphers.
class Failures
  def boom
    raise OpenSSL::Cipher::CipherError.new("bad decrypt")
  end

  def rescue_it
    yield
  rescue OpenSSL::Cipher::CipherError
    nil
  end
end

# The app's own class, with the same method names.
class Vault
  def encrypt(value)
    "enc:#{value}"
  end

  def public_encrypted?(record)
    record.public_flag
  end
end

store = Vault.new
puts store.encrypt("x")
