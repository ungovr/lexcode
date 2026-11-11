# lexcode-expect: 16
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
