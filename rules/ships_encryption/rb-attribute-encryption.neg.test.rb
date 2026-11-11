# lexcode-expect: 0
# Models that store sensitive columns without encrypting them in the app:
# hashed passwords, digests, signed ids, and methods that merely read like the
# encryption macros.

class User < ApplicationRecord
  has_secure_password
  has_secure_token :api_token
  validates :email, presence: true, uniqueness: true
  normalizes :email, with: ->(email) { email.strip.downcase }
  attribute :ssn_digest, :string

  before_save { self.ssn_digest = Digest::SHA256.hexdigest(ssn.to_s) }
end

class Account < ApplicationRecord
  attr_accessor :encrypted_password_hint
  attr_reader :decrypted_view
  serialize :preferences, coder: JSON

  def encrypted?
    password_digest.present?
  end

  def encrypts_everything?
    false
  end
end

# A scope, a concern and a service that only mention encryption by name.
module Encryptable
  extend ActiveSupport::Concern

  def encrypted_label
    "encrypted"
  end
end

class Report
  def run(items)
    encrypts_all(items)
  end

  def encrypts_all(items)
    items.map(&:to_s)
  end
end
