# lexcode-expect: 5
# Account models: the person signs up and signs in with stored credentials.
class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable, :rememberable, :validatable
end

class Member < ApplicationRecord
  has_secure_password
  has_many :posts
end

class Reader < ApplicationRecord
  has_secure_password validations: false
end

# Authlogic.
class Pseudonym < ActiveRecord::Base
  acts_as_authentic do |config|
    config.validate_email_field = false
  end
end

# Sorcery.
class Customer < ApplicationRecord
  authenticates_with_sorcery!
end
