# lexcode-expect: 10
# Models that encrypt ordinary data with the application's own cryptography:
# Rails 7 Active Record Encryption, Lockbox and attr_encrypted, with names that
# only look like access-control words (shipping, footprint, zip_code), a
# parenthesized list, and a list that mixes a sign-in secret with ordinary data.

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
  attr_encrypted :bank_account_number, key: ENV.fetch("ATTR_ENCRYPTED_KEY")
end

# The same macro inside a nested class.
module Billing
  class Card
    self.table_name = "cards"
    encrypts :number
  end
end

# Ordinary data whose names hold a short access-control word inside another word,
# a parenthesized list, and a mixed list (the phone number is ordinary data).
class Shipment < ApplicationRecord
  encrypts :shipping_address, :zip_code
  encrypts(:carbon_footprint)
  encrypts :otp_secret, :phone_number
end
