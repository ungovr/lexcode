# lexcode-expect: 5
# Twilio TwiML that takes a caller's voice: a speech-recognizing assistant menu, and a
# voicemail the caller leaves that Twilio transcribes.
require "twilio-ruby"

class VoiceAssistantController < ApplicationController
  skip_before_action :verify_authenticity_token

  # The caller says what they need; Twilio recognizes the speech and posts the text back.
  def welcome
    response = Twilio::TwiML::VoiceResponse.new
    response.gather(input: "speech", action: "/assistant/answer", speech_timeout: "auto", language: "en-US") do |gather|
      gather.say(message: "How can I help you today?")
    end
    render xml: response.to_s
  end

  # Block form, speech and keypad together.
  def menu
    response = Twilio::TwiML::VoiceResponse.new do |r|
      r.gather(input: "dtmf speech", action: "/assistant/answer", hints: "permit, license, parking") do |gather|
        gather.say(message: "Say or press a number.")
      end
    end
    render xml: response.to_s
  end

  # A voicemail that is transcribed.
  def voicemail
    response = Twilio::TwiML::VoiceResponse.new
    response.say(message: "Leave a message after the tone.")
    response.record(max_length: 120, transcribe: true, transcribe_callback: "/voicemail/transcribed")
    render xml: response.to_s
  end
end

# The TwiML node objects built directly.
class NodeBuilder
  def listen
    Twilio::TwiML::Gather.new(input: "speech", action: "/answer", timeout: 3)
  end

  def mailbox
    Twilio::TwiML::Record.new(transcribe: true, max_length: 60)
  end
end
