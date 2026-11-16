# lexcode-expect: 0
# Ruby's OpenSSL bindings used for something other than encryption: hashing, a MAC, key derivation,
# password hashing, signing with a key, random bytes, stock HTTPS and a TLS context, and cipher
# errors, which are exceptions, not ciphers.
require "digest"
require "net/http"
require "openssl"

class Integrity
  def digest(text)
    [Digest::SHA256.hexdigest(text), OpenSSL::Digest.new("SHA256").hexdigest(text)]
  end

  def mac(body, secret)
    OpenSSL::HMAC.hexdigest("SHA256", secret, body)
  end

  def derive(password, salt)
    [
      OpenSSL::KDF.pbkdf2_hmac(password, salt: salt, iterations: 600_000, length: 32, hash: "sha256"),
      OpenSSL::PKCS5.pbkdf2_hmac(password, salt, 600_000, 32, "sha256"),
      OpenSSL::KDF.scrypt(password, salt: salt, N: 2**14, r: 8, p: 1, length: 32)
    ]
  end

  def hash_password(password)
    BCrypt::Password.create(password)
  end

  def sign_with_key(data)
    key = OpenSSL::PKey::RSA.new(File.read("private.pem"))
    key.sign(OpenSSL::Digest.new("SHA256"), data)
  end

  def verify(key, signature, data)
    key.verify("SHA256", signature, data)
  end

  # An OpenSSL 3 key used only to sign, and other objects' encrypt, decrypt and derive in a file that
  # names OpenSSL: the key methods are read only on a key from OpenSSL::PKey.
  def sign_with_pkey(pem, data)
    key = OpenSSL::PKey.read(pem)
    key.sign("SHA256", data)
  end

  def others(vault, keygen, salt)
    [vault.encrypt("x"), vault.decrypt("y"), keygen.derive(salt)]
  end

  def issue(user)
    JWT.encode({ sub: user.id }, Rails.application.secret_key_base, "HS256")
  end

  def signer(secret)
    ActiveSupport::MessageVerifier.new(secret)
  end

  def token
    [SecureRandom.urlsafe_base64(32), OpenSSL::Random.random_bytes(16)]
  end

  def get(url)
    uri = URI("https://api.example.org/v1/items")
    Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.get(uri.request_uri) }
  end

  def context
    ctx = OpenSSL::SSL::SSLContext.new
    ctx.verify_mode = OpenSSL::SSL::VERIFY_PEER
    ctx
  end

  def boom
    raise OpenSSL::Cipher::CipherError.new("bad decrypt")
  end

  def rescue_it
    yield
  rescue OpenSSL::Cipher::CipherError
    nil
  end
end
