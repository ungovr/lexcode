# lexcode-expect: 4
# Placing a Twilio call with recording on, and starting a recording on a live call,
# with the twilio-ruby helper library in a service object and a job.
require "twilio-ruby"

class CallCenter
  def initialize
    @client = Twilio::REST::Client.new(ENV.fetch("TWILIO_ACCOUNT_SID"), ENV.fetch("TWILIO_AUTH_TOKEN"))
  end

  def call_and_record(to, from, url)
    @client.calls.create(to: to, from: from, url: url, record: true, recording_channels: "dual")
  end

  def call_with_setting(to, from, url, settings)
    @client.calls.create(to: to, from: from, url: url, record: settings[:record])
  end

  def record_mid_call(call_sid)
    @client.calls(call_sid).recordings.create(recording_channels: "dual")
  end
end

class RecordedDialJob < ApplicationJob
  def perform(agent_number, customer_number)
    client = Twilio::REST::Client.new
    client.calls.create(
      to: customer_number,
      from: ENV.fetch("TWILIO_NUMBER"),
      twiml: "<Response><Dial>#{agent_number}</Dial></Response>",
      record: "record-from-answer-dual"
    )
  end
end
