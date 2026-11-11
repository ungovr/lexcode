# lexcode-expect: 24
# Encrypting data or agreeing keys with a cryptography library the product
# bundles: Ruby's OpenSSL bindings, Rails' message encryptor, RbNaCl, Fernet,
# Lockbox, JWE and others.
require "openssl"

# OpenSSL ciphers, in the shapes people write them.
class FieldCipher
  def encrypt(plain, key)
    cipher = OpenSSL::Cipher.new("aes-256-gcm")
    cipher.encrypt
    cipher.key = key
    iv = cipher.random_iv
    [iv, cipher.update(plain) + cipher.final, cipher.auth_tag]
  end

  def decrypt(iv, data, tag, key)
    cipher = OpenSSL::Cipher.new 'aes-256-gcm'
    cipher.decrypt
    cipher.key = key
    cipher.iv = iv
    cipher.auth_tag = tag
    cipher.update(data) + cipher.final
  end

  def scoped(key)
    ::OpenSSL::Cipher.new("aes-128-cbc").tap { |c| c.encrypt; c.key = key }
  end

  def named_classes
    [OpenSSL::Cipher::AES.new(256, :CBC), OpenSSL::Cipher::AES256.new(:CBC), ::OpenSSL::Cipher::AES128.new(:CBC)]
  end
end

# RSA public-key encryption and S/MIME.
class Envelope
  def seal(public_key, secret)
    public_key.public_encrypt(secret, OpenSSL::PKey::RSA::PKCS1_OAEP_PADDING)
  end

  def open(private_key, sealed)
    private_key.private_decrypt(sealed, OpenSSL::PKey::RSA::PKCS1_OAEP_PADDING)
  end

  def smime(certs, data)
    OpenSSL::PKCS7.encrypt(certs, data, OpenSSL::Cipher.new("aes-256-cbc"))
  end
end

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
