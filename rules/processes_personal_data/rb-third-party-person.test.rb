# lexcode-expect: 10
# Services and jobs that hand a person's email address to an outside vendor.
class BillingService
  def create_customer(user)
    Stripe::Customer.create(email: user.email, name: user.display_name)
  end

  def change_email(user)
    Stripe::Customer.update(user.stripe_id, email: user.email)
    Stripe::Customer.create({ email: user.email })
  end
end

class ApplicationController < ActionController::Base
  before_action :tag_errors

  def tag_errors
    Sentry.set_user(id: current_user&.id, email: current_user&.email)
  end
end

class IdentifyJob < ApplicationJob
  def perform(user)
    Analytics.identify(user_id: user.id.to_s, traits: { email: user.email, plan: user.plan })
  end
end

class SupportSync
  def push(user)
    intercom.contacts.create(email: user.email, name: user.name)
    Hubspot::Contact.create(firstname: user.first_name, email: user.email)
  end
end

class Newsletter
  def subscribe(user)
    gibbon.lists(list_id).members.create(body: { email_address: user.email, status: "subscribed" })
  end
end

class Avatars
  # A hash of the address leaves for Gravatar's servers when the browser loads the image.
  def url(user, size = 80)
    "https://secure.gravatar.com/avatar/#{Digest::MD5.hexdigest(user.email)}?s=#{size}"
  end
end

# Shapes the anchor must admit: a leading-dot chain, a trailing dot and safe navigation.
class ChainShapesNewsletter
  def subscribe(user)
    gibbon.lists(list_id).members.create(:body => { :email_address => user.email, :status => "subscribed" })
  end
end
