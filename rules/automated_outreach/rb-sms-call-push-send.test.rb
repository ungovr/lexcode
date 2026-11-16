# lexcode-expect: 33
# Texts, calls and push notifications, where the code does not show whether a person just asked.
class NotificationsController < ApplicationController
  def reminder
    client = Twilio::REST::Client.new(ENV["TWILIO_SID"], ENV["TWILIO_TOKEN"])
    client.messages.create(from: "+15550100", to: params[:phone], body: "Reminder: your appointment is tomorrow.")
    client.messages.create(from: "+15550100", to: @user.phone, body: render_to_string(partial: "reminder"))
    client.api.account.messages.create(from: "+15550100", to: @user.phone, body: "Trash pickup moves to Tuesday.")
  end

  def robocall
    client.messages.create(body: "Pool closed today.", to: @user.phone, from: "+15550100")
    client.calls.create(from: "+15550100", to: params[:phone], url: "https://example.org/voice.xml")
  end
end

class PushSender
  def deliver(subscription, payload)
    Webpush.payload_send(
      message: payload,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      vapid: { subject: "mailto:ops@example.org", public_key: ENV["VAPID_PUBLIC"], private_key: ENV["VAPID_PRIVATE"] }
    )
  end

  def apns(token, text)
    Rpush::Apns2::Notification.create!(app: Rpush::Apns2::App.find_by_name("ios"), device_token: token, alert: text)
  end

  def fcm(token, text)
    Rpush::Fcm::Notification.create!(app: Rpush::Fcm::App.find_by_name("android"), registration_ids: [token], notification: { body: text })
  end
end

class OtherCarriers
  def text(user, body)
    sms_gateway.send_sms(to: user.phone, text: body)
    SmsClient.new.send_sms(user.phone, body)
    sns.publish(phone_number: user.phone, message: body)
    vonage.sms.send(from: "Example", to: user.phone, text: body)
    Telnyx::Message.create(from: "+15550100", to: user.phone, text: body)
  end
end

class ParenlessCarriers
  def run(user)
    client.calls.create from: "+15550100", to: user.phone, url: "https://example.org/voice.xml"
    sns.publish phone_number: user.phone, message: "Pool closed today."
    vonage.sms.send from: "Example", to: user.phone, text: "Pool closed today."
  end
end

# Shapes the anchor must admit: a leading-dot chain, a trailing dot and safe navigation.
class ChainShapesCarriers
  def run(user, payload)
    client&.messages&.create(from: "+15550100", to: user.phone, body: "Hi")
    client
      .calls
      .create(from: "+15550100", to: user.phone, url: "https://example.org/voice.xml")
    Webpush
      .payload_send(message: payload, endpoint: user.endpoint)
    Rpush::Apns2::Notification
      .create!(app: Rpush::Apns2::App.find_by_name("ios"), device_token: user.token, alert: "Hi")
    sns&.publish(phone_number: user.phone, message: "Hi")
    vonage
      .sms
      .send(from: "Example", to: user.phone, text: "Hi")
  end
end

# Shapes the anchor must also admit: an empty () after a no-arg method, a comment line or a
# backslash between the two tokens, and (schema, Mailchimp) text after or far from the key.
class ResidualShapesCarriers
  def run(user, payload)
    client.messages().create(from: "+15550100", to: user.phone, body: "Hi")
    vonage.sms().send(from: "Example", to: user.phone, text: "Hi")
    client.calls # voice
      .create(from: "+15550100", to: user.phone, url: "https://example.org/voice.xml")
    Webpush # browser push
      .payload_send(message: payload, endpoint: user.endpoint)
    client.messages \
      .create(from: "+15550100", to: user.phone, body: "Hi")
  end
end

# A promo code is marketing, not a one-time code, and a recipient attribute named like
# verification says nothing about the message.
class WinBackJob < ApplicationJob
  def perform(user)
    client.messages.create(from: "+15550100", to: user.phone, body: "Use promo code SAVE20 for 20% off this weekend")
  end

  def nudge(user)
    client.messages.create(from: "+15550100", to: user.verified_phone, body: "We miss you! Come back for 20% off")
  end
end

# A Twilio content template has no body: to read, so it counts.
class TemplateBlastJob < ApplicationJob
  def perform(user)
    client.messages.create(from: "+15550100", to: user.phone, content_sid: "HXb5b62575e6e4ff6129ad7c8efe1f983e", content_variables: { "1" => user.first_name }.to_json)
  end
end

# Promo wording in other spellings, and "verified" that is not a verification.
class SpringSaleJob < ApplicationJob
  def perform(user, coupon)
    client.messages.create(from: "+15550100", to: user.phone, body: "Promo-code SAVE20 ends tonight")
    client.messages.create(from: "+15550100", to: user.phone, body: "Use #{coupon.code} for 20% off")
    client.messages.create(from: "+15550100", to: user.phone, body: "Verified buyers save 20% today")
  end
end
