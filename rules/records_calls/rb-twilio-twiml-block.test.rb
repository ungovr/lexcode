# lexcode-expect: 7
# TwiML that records, written in the block form twilio-ruby offers, and TwiML nodes
# built directly.
require "twilio-ruby"

class BlockCallsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def voicemail
    response = Twilio::TwiML::VoiceResponse.new do |r|
      r.say(message: "Leave a message after the tone.")
      r.record(max_length: 120, action: "/voicemail/done")
    end
    render xml: response.to_s
  end

  def bridge_and_record
    response = Twilio::TwiML::VoiceResponse.new do |r|
      r.dial(number: params[:agent], record: "record-from-answer-dual")
    end
    render xml: response.to_s
  end

  def recorded_conference
    response = Twilio::TwiML::VoiceResponse.new do |r|
      r.dial do |dial|
        dial.conference("support-room", record: "record-from-start", beep: false)
      end
    end
    render xml: response.to_s
  end

  def braces
    xml = Twilio::TwiML::VoiceResponse.new { |r| r.record(play_beep: false) }
    render xml: xml.to_s
  end
end

# Node objects, no block.
class NodeBuilder
  def mailbox
    Twilio::TwiML::Record.new(max_length: 60)
  end

  def bridge(number)
    Twilio::TwiML::Dial.new(number, record: "record-from-ringing")
  end

  def room(name)
    Twilio::TwiML::Conference.new(name, record: "record-from-start")
  end
end
