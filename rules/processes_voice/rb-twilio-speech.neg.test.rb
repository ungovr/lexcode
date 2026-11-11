# lexcode-expect: 0
# Twilio TwiML that talks to the caller without taking their speech: a keypad menu, a
# greeting, a forward, and an unrelated object with a record or gather method.
require "twilio-ruby"

class MenuController < ApplicationController
  # Keypad digits only: the caller presses keys, nobody's voice is recognized.
  def menu
    response = Twilio::TwiML::VoiceResponse.new do |r|
      r.gather(num_digits: 1, action: "/menu/choice", input: "dtmf") do |gather|
        gather.say(message: "Press 1 for the clerk, 2 for the treasurer.")
      end
    end
    render xml: response.to_s
  end

  def default_menu
    response = Twilio::TwiML::VoiceResponse.new
    response.gather(num_digits: 1, action: "/menu/choice") do |gather|
      gather.say(message: "Press 1 for the clerk.")
    end
    render xml: response.to_s
  end

  def greeting
    response = Twilio::TwiML::VoiceResponse.new
    response.say(message: "Thanks for calling the county office.")
    response.dial(number: "+15555550100", timeout: 20)
    render xml: response.to_s
  end
end

# Local objects that borrow the verb names.
class ChangeLog
  def initialize
    @entries = []
  end

  def record(entry, transcribe: false)
    @entries << (transcribe ? entry.to_s : entry)
  end
end

class Survey
  def gather(answers, input: "form")
    answers.select { |a| a.source == input }
  end
end

class Audit
  def run(log, survey)
    log.record("opened", transcribe: false)
    survey.gather([], input: "typed")
  end
end
