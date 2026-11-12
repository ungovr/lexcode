# lexcode-expect: 5
# TwiML a webhook returns to Twilio, built on a variable: record the caller, record a
# bridged call, and record a conference.
require "twilio-ruby"

class CallsController < ApplicationController
  skip_before_action :verify_authenticity_token

  def voicemail
    response = Twilio::TwiML::VoiceResponse.new
    response.say(message: "Leave a message after the tone.")
    response.record(max_length: 120, transcribe: true, action: "/voicemail/done")
    render xml: response.to_s
  end

  def bridge_and_record
    response = Twilio::TwiML::VoiceResponse.new
    response.dial(number: params[:agent], record: "record-from-answer-dual")
    render xml: response.to_s
  end

  def recorded_conference
    response = Twilio::TwiML::VoiceResponse.new
    dial = Twilio::TwiML::Dial.new
    dial.conference("support-room", record: "record-from-start")
    response.append(dial)
    response.record(play_beep: false)
    render xml: response.to_s
  end

  # An instance variable and a settings value that may turn recording on.
  def configured
    @twiml = Twilio::TwiML::VoiceResponse.new
    @twiml.dial(number: params[:agent], record: Setting.get(:call_recording))
    render xml: @twiml.to_s
  end
end
