# lexcode-expect: 0
# Sign-in and payments that check nobody's identity document or credential:
# Devise, OmniAuth, a password check, Stripe used for card payments, and the
# app's own classes that share names with a vendor's.

class User < ApplicationRecord
  devise :database_authenticatable, :registerable, :recoverable, :rememberable,
         :omniauthable, omniauth_providers: %i[google_oauth2 github]
  has_secure_password
end

class SessionsController < Devise::SessionsController
  def create
    user = User.find_by(email: params[:email])
    if user&.authenticate(params[:password])
      sign_in(user)
      redirect_to root_path
    else
      render :new, status: :unprocessable_entity
    end
  end
end

class OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    @user = User.from_omniauth(request.env["omniauth.auth"])
    sign_in_and_redirect @user
  end
end

Rails.application.config.middleware.use OmniAuth::Builder do
  provider :google_oauth2, ENV["GOOGLE_ID"], ENV["GOOGLE_SECRET"]
  provider :developer if Rails.env.development?
end

class PasswordCheck
  def call(user, password)
    BCrypt::Password.new(user.password_digest) == password
  end
end

# Stripe used for card payments only.
class CheckoutsController < ApplicationController
  def create
    intent = Stripe::PaymentIntent.create(amount: params[:amount].to_i, currency: "usd")
    render json: { client_secret: intent.client_secret }
  end

  def customer
    Stripe::Customer.create(email: current_user.email)
  end
end

# The app's own classes, named like a vendor's.
class Verifier
  def initialize(session)
    @session = session
  end

  def verified?
    @session[:user_id].present?
  end
end

module Veriff
  class Session
    def self.create
      new
    end
  end
end

class Wallet
  def self.new(balance)
    super()
  end
end

# A wallet-side (holder) object, not a verifier, and a note that names a vendor.
holder = OpenID4VP::Wallet.new(metadata: wallet_metadata)
NOTE = "We used to run Onfido::DefaultApi checks; see Stripe::Identity docs."
