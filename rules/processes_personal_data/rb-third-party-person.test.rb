# lexcode-expect: 11
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

# Shapes the anchor must also admit: an empty () after a no-arg method, a comment line or a
# backslash between the two tokens, and (schema, Mailchimp) text after or far from the key.
class ResidualShapesNewsletter
  def subscribe(user)
    gibbon.lists(list_id).members.create(
      body: {
        merge_fields: {
          FNAME: user.first_name, LNAME: user.last_name, ADDRESS: user.street_address,
          CITY: user.city, STATE: user.state, ZIP: user.postal_code, COUNTRY: user.country,
          EMPLOYER: user.employer, TITLE: user.job_title, SOURCE: "signup form",
          REFERRER: user.referrer, PLAN: user.plan, LOCALE: user.locale, ZONE: user.time_zone,
          NOTES: "Subscribed from the footer form on the home page of the site",
          CAMPAIGN: "autumn-newsletter-2026", SEGMENT: "all-subscribers-and-friends"
        },
        email_address: user.email,
        status: "subscribed"
      }
    )
  end
end
