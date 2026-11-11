# lexcode-expect: 5
# Creating BigBlueButton web conferences with recording on: through the
# bigbluebutton-api-ruby gem, and by building the create call's parameters directly.
require "bigbluebutton_api"

class ConferenceRoom < ApplicationRecord
  def api
    @api ||= BigBlueButton::BigBlueButtonApi.new(ENV.fetch("BBB_URL"), ENV.fetch("BBB_SECRET"), "0.9")
  end

  # The gem's options hash, as keywords.
  def start
    api.create_meeting(title, key, record: true, duration: 120)
  end

  # The same options with braces, record taken from a setting.
  def start_from_settings
    api.create_meeting(title, key, { :record => settings[:record], :duration => 120 })
  end
end

class ConferenceRequest
  # Parameters for the create call built by hand, hash-rocket and keyword style.
  def params(conference_key, settings)
    {
      :meetingID => conference_key,
      :name => "Office hours",
      :attendeePW => settings[:user_key],
      :moderatorPW => settings[:admin_key],
      :record => settings[:record] ? true : false
    }
  end

  def modern_params(conference_key)
    { meetingID: conference_key, name: "Town hall", record: true, autoStartRecording: false }
  end

  def reordered(conference_key)
    { record: "true", meetingID: conference_key, name: "Open session" }
  end
end
