# lexcode-expect: 0
# Vendor calls that carry no email address, and a vendor-shaped call on a literal address.
class BillingService
  def charge(order)
    Stripe::Charge.create(amount: order.total_cents, currency: "usd", metadata: { order_id: order.id })
  end

  def seed_demo_customer
    # The app's own fixed address, not a person's.
    Stripe::Customer.create(email: "billing@example.org", description: "demo account")
  end
end

class ApplicationController < ActionController::Base
  def tag_errors
    Sentry.set_tags(locale: I18n.locale, plan: current_account.plan)
    Sentry.capture_message("tagged")
  end
end

# A local object with a Segment-shaped method name and no email trait.
class Metrics
  def identify(user_id:, traits: {})
    traits.merge(user_id: user_id)
  end
end

Metrics.new.identify(user_id: 7, traits: { plan: "pro" })

# A gravatar mention that sends nothing.
GRAVATAR_DOCS = "Set your avatar at gravatar.com"

# A plain hash with an email key, handed to no vendor.
settings = { email: "support@example.org", id: 1 }
settings.fetch(:email)
