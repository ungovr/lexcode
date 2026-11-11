# lexcode-expect: 0
# Authentication that is not a person's account, and lookalikes.
class Integration < ApplicationRecord
  # A random token for a machine client, with no identity or password behind it.
  has_secure_token :api_key
  has_many :deliveries
end

# One shared credential for a staging banner, not a user account.
class StagingController < ActionController::Base
  http_basic_authenticate_with name: "staging", password: ENV.fetch("STAGING_PASSWORD")

  def index
    render plain: "ok"
  end
end

# Token auth for an API consumer.
class Api::BaseController < ActionController::API
  before_action :authenticate

  private

  def authenticate
    authenticate_or_request_with_http_token do |token, _options|
      ActiveSupport::SecurityUtils.secure_compare(token, ENV.fetch("API_TOKEN"))
    end
  end
end

# A spec signing in as a test user; it declares no account model.
RSpec.describe "dashboard" do
  it "loads" do
    sign_in create(:user)
    get "/dashboard"
    expect(response).to be_successful
  end
end

# A plain class that mentions the words without calling the macros.
class PasswordPolicy
  MINIMUM = 12

  def secure?(password)
    password.length >= MINIMUM
  end
end
