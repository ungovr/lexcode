# lexcode-expect: 0
# TwiML that greets, forwards and bridges a call without recording it, in the
# variable form and the block form, and local objects with a record method.
require "twilio-ruby"

class IvrController < ApplicationController
  def greet
    response = Twilio::TwiML::VoiceResponse.new
    response.say(message: "Thanks for calling the clerk.")
    response.gather(num_digits: 1, action: "/menu")
    render xml: response.to_s
  end

  def forward
    response = Twilio::TwiML::VoiceResponse.new
    response.dial(number: params[:to], caller_id: "+15555550100", timeout: 20)
    render xml: response.to_s
  end

  def bridge_unrecorded
    response = Twilio::TwiML::VoiceResponse.new
    response.dial(number: params[:to], record: "do-not-record")
    render xml: response.to_s
  end

  def conference
    response = Twilio::TwiML::VoiceResponse.new
    response.dial do |dial|
      dial.conference("support-room", record: "do-not-record", beep: false)
    end
    render xml: response.to_s
  end

  def block_form
    response = Twilio::TwiML::VoiceResponse.new do |r|
      r.say(message: "One moment.")
      r.dial(number: params[:to], timeout: 15)
    end
    render xml: response.to_s
  end
end

class AuditLog
  def initialize
    @entries = []
  end

  def record(entry)
    @entries << entry
  end
end

class CallNotes
  def note(log, sid)
    log.record({ sid: sid })
  end

  def conference(room, record: false)
    [room, record]
  end
end
