# lexcode-expect: 0
# TwiML in block form and node form that never records: greeting, menu, forward, a
# bridge and a conference marked do-not-record, and a local log with a record method
# used inside the same block.
require "twilio-ruby"

class BlockIvrController < ApplicationController
  def greet
    response = Twilio::TwiML::VoiceResponse.new do |r|
      r.say(message: "Thanks for calling the clerk.")
      r.gather(num_digits: 1, action: "/menu")
    end
    render xml: response.to_s
  end

  def forward
    response = Twilio::TwiML::VoiceResponse.new do |r|
      r.dial(number: params[:to], caller_id: "+15555550100", timeout: 20)
    end
    render xml: response.to_s
  end

  def bridge_unrecorded
    response = Twilio::TwiML::VoiceResponse.new do |r|
      r.dial(number: params[:to], record: "do-not-record")
      r.dial do |dial|
        dial.conference("support-room", record: "do-not-record")
      end
    end
    render xml: response.to_s
  end
end

class NodeBuilder
  def bridge(number)
    Twilio::TwiML::Dial.new(number: number, record: "do-not-record", timeout: 10)
  end

  def room(name)
    Twilio::TwiML::Conference.new(name, record: "do-not-record")
  end

  def plain_room(name)
    Twilio::TwiML::Conference.new(name, beep: false)
  end
end

# A local logger, outside any TwiML block.
class CallAudit
  def initialize
    @entries = []
  end

  def record(entry)
    @entries << entry
  end

  def note(sid)
    record({ sid: sid })
  end
end
