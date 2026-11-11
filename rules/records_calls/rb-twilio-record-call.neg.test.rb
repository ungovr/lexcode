# lexcode-expect: 0
# Twilio calls placed or handled without recording: plain calls, record turned off,
# a status lookup, a hang-up, a text message, and a local object with a calls method.
require "twilio-ruby"

class OutboundCalls
  def initialize
    @client = Twilio::REST::Client.new(ENV.fetch("TWILIO_ACCOUNT_SID"), ENV.fetch("TWILIO_AUTH_TOKEN"))
  end

  def place(to, from, url)
    @client.calls.create(to: to, from: from, url: url, status_callback: "https://example.org/status")
  end

  def place_unrecorded(to, from)
    @client.calls.create(to: to, from: from, twiml: "<Response><Say>Hello</Say></Response>", record: false)
  end

  def place_unrecorded_string(to, from, url)
    @client.calls.create(to: to, from: from, url: url, record: "false")
  end

  def hang_up(sid)
    @client.calls(sid).update(status: "completed")
  end

  def status(sid)
    @client.calls(sid).fetch.status
  end

  def remind(to, from, body)
    @client.messages.create(to: to, from: from, body: body)
  end
end

# A local model, not Twilio.
class Roster
  def initialize
    @people = []
  end

  def calls
    @people.map(&:name)
  end

  def create(name:, record: nil)
    @people << Struct.new(:name, :record).new(name, record)
  end
end

class RosterBuilder
  def run
    roster = Roster.new
    roster.create(name: "Ada", record: nil)
    roster.calls
  end
end
