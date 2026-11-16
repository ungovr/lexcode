# lexcode-expect: 20
# Ruby's own OpenSSL bindings used to keep data confidential: a cipher by name and by class, RSA
# encryption and decryption, and an ECDH key agreement, with and without parentheses, over several
# lines, and through a safe navigation operator.
require "openssl"

class FieldCipher
  def seal(plain, key)
    cipher = OpenSSL::Cipher.new("aes-256-gcm") # 1
    cipher.encrypt
    cipher.key = key
    iv = cipher.random_iv
    [iv, cipher.update(plain) + cipher.final, cipher.auth_tag]
  end

  def open_cbc(data, key, iv)
    cipher = ::OpenSSL::Cipher.new("aes-256-cbc").decrypt # 2
    cipher.key = key
    cipher.iv = iv
    cipher.update(data) + cipher.final
  end

  def paren_less
    OpenSSL::Cipher.new "chacha20-poly1305" # 3
  end

  def named_classes
    [OpenSSL::Cipher::AES.new(256, :CBC), OpenSSL::Cipher::AES256.new(:CBC)] # 4, 5
  end

  def legacy
    ::OpenSSL::Cipher::DES.new( # 6
      :EDE3,
      :CBC
    )
  end

  def smime(certs, data)
    OpenSSL::PKCS7.encrypt(certs, data, OpenSSL::Cipher.new("aes-256-cbc")) # 7
  end

  def rsa(public_key, private_key, secret)
    sealed = public_key.public_encrypt(secret, OpenSSL::PKey::RSA::PKCS1_OAEP_PADDING) # 8
    private_key.private_decrypt(sealed, OpenSSL::PKey::RSA::PKCS1_OAEP_PADDING) # 9
  end

  def rsa_paren_less(public_key, secret)
    public_key.public_encrypt secret # 10
  end

  def rsa_safe(private_key, sealed)
    private_key&.private_decrypt(sealed) # 11
  end

  def rsa_split(public_key, secret)
    public_key
      .public_encrypt(secret) # 12
  end

  def agree(mine, peer)
    mine.dh_compute_key(peer.public_key) # 13
  end

  def agree_paren_less(mine, point)
    mine.dh_compute_key point # 14
  end

  def wrapped_key(pem)
    OpenSSL::PKey::RSA.new(pem).public_encrypt("data key") # 15
  end

  # The OpenSSL 3 key methods, on a key the scope loaded or generated.
  def pkey_encrypt(pem, data)
    key = OpenSSL::PKey.read(pem)
    sealed = key.encrypt(data, "rsa_padding_mode" => "oaep") # 16
    key.decrypt sealed # 17
  end

  def pkey_derive(peer)
    mine = OpenSSL::PKey.generate_key("X25519")
    mine&.derive(peer) # 18
  end

  def pkey_chain(pem, data)
    OpenSSL::PKey.read(pem).encrypt(data) # 19
  end

  def pkey_class(peer)
    ec = OpenSSL::PKey::EC.generate("prime256v1")
    ec
      .derive(peer) # 20
  end
end
