# lexcode-expect: 0
# The app's own objects that answer to the RSA and Diffie-Hellman method names, and its own Cipher
# class, in a file that never names the standard library's crypto module.
class Vault
  def public_encrypt(value)
    "enc:#{value}"
  end

  def private_decrypt(value)
    value.delete_prefix("enc:")
  end

  def dh_compute_key(point)
    point
  end
end

class Cipher
  def initialize(name)
    @name = name
  end
end

store = Vault.new
store.public_encrypt("x")
store&.private_decrypt "enc:x"
store.dh_compute_key(1)
Cipher.new("rot13")
