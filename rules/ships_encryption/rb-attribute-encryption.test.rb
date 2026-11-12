# lexcode-expect: 7
# Models that encrypt columns with the application's own cryptography: Rails
# 7 Active Record Encryption, Lockbox and attr_encrypted.

# Rails 7 Active Record Encryption.
class Patient < ApplicationRecord
  encrypts :ssn
  encrypts :email, deterministic: true, downcase: true
  encrypts :notes, key_provider: NotesKeyProvider.new
end

# Lockbox.
class Customer < ApplicationRecord
  has_encrypted :phone, :birthday, type: :date
  encrypts_attached :id_scan
end

# attr_encrypted.
class Credential < ApplicationRecord
  attr_encrypted :api_secret, key: ENV.fetch("ATTR_ENCRYPTED_KEY")
end

# The same macro inside a nested class.
module Billing
  class Card
    self.table_name = "cards"
    encrypts :number
  end
end
