# lexcode-expect: 14
# Encrypting data or agreeing keys with a cryptography library the product
# bundles: Rails' message encryptor, RbNaCl, Fernet, Lockbox, JWE gems and
# others. Ruby's own OpenSSL bindings are the platform's, see the negative fixture.

# Rails' message encryptor, for cookies and tokens of the app's own.
class TokenBox
  def initialize(secret)
    @encryptor = ActiveSupport::MessageEncryptor.new(secret)
  end

  def scoped(secret)
    ::ActiveSupport::MessageEncryptor.new(secret, cipher: "aes-256-gcm")
  end
end

# RbNaCl: secret boxes, public-key boxes and AEAD.
class Sodium
  def secret(key)
    RbNaCl::SecretBox.new(key)
  end

  def simple(key)
    RbNaCl::SimpleBox.from_secret_key(key)
  end

  def public_key(public_key, private_key)
    RbNaCl::Box.new(public_key, private_key)
  end

  def sealed(public_key)
    RbNaCl::Boxes::Sealed.from_public_key(public_key)
  end

  def aead(key)
    RbNaCl::AEAD::XChaCha20Poly1305IETF.new(key)
  end
end

# Other libraries' APIs.
class Others
  def fernet(secret, message)
    Fernet.generate(secret, message)
  end

  def lockbox(key)
    Lockbox.new(key: key)
  end

  def jwe(payload, key)
    JWE.encrypt(payload, key, enc: "A128GCM")
  end

  def json_jwe(jws, secret)
    jwe = JSON::JWE.new(jws)
    jwe.alg = "dir"
    jwe.encrypt!(secret)
    ::JSON::JWE.new(jws)
  end

  def symmetric(value)
    SymmetricEncryption.encrypt(value)
  end

  def gibberish(passphrase)
    Gibberish::AES.new(passphrase)
  end
end
