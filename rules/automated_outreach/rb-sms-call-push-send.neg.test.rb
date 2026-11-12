# lexcode-expect: 0
# A one-time code or a verification text a person just asked for, an SNS publish to a queue topic,
# and a model's `messages.create` that is not a text message.
class VerificationsController < ApplicationController
  def create
    client = Twilio::REST::Client.new(ENV["TWILIO_SID"], ENV["TWILIO_TOKEN"])
    client.messages.create(from: "+15550100", to: params[:phone], body: "Your verification code is #{generate_code}")
  end

  def otp
    sms.messages.create(from: "+15550100", to: current_user.phone, body: "OTP #{@otp}")
  end

  def pin_reset
    sms.messages.create(to: current_user.phone, from: "+15550100", body: "Your PIN was reset: #{@pin}")
  end
end

class EventPublisher
  def publish(event)
    # SNS topic for internal events: contacts nobody.
    sns.publish(topic_arn: ENV["EVENTS_TOPIC"], message: event.to_json)
  end
end

class Assistant
  def ask(question)
    anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 100, messages: [{ role: "user", content: question }])
  end
end

class WebPushSubscriptionsController < ApplicationController
  def create
    # Saving the browser's subscription sends nothing.
    current_user.push_subscriptions.create!(endpoint: params[:endpoint], p256dh: params[:p256dh], auth: params[:auth])
  end
end

class LoginCodesController < ApplicationController
  # The one-time code built elsewhere and passed in by name, or through a translation key.
  def create
    client.messages.create(from: "+15550100", to: params[:phone], body: verification_message)
    client.messages.create(from: "+15550100", to: params[:phone], body: I18n.t("sms.otp", code: @code))
  end
end

class SignInTextsController < ApplicationController
  # One-time codes and sign-in links named with underscores, or worded as 2FA or a link.
  def create
    client.messages.create(from: "+15550100", to: params[:phone], body: otp_message)
    client.messages.create(from: "+15550100", to: params[:phone], body: login_code_text)
    client.messages.create(from: "+15550100", to: params[:phone], body: I18n.t("sms.login_code"))
    client.messages.create(from: "+15550100", to: params[:phone], body: "2FA: #{@code_value}")
    client.messages.create(from: "+15550100", to: params[:phone], body: "Here is your sign-in link: #{@url}")
  end
end
