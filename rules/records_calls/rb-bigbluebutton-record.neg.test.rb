# lexcode-expect: 0
# BigBlueButton meetings created without recording, recordings left alone, and
# hashes with a record key that have nothing to do with a meeting server.
require "bigbluebutton_api"

class MeetingRooms
  def initialize
    @api = BigBlueButton::BigBlueButtonApi.new(ENV.fetch("BBB_URL"), ENV.fetch("BBB_SECRET"), "0.9")
  end

  def open(room)
    @api.create_meeting(room.name, room.key, { moderator_password: "mp", attendee_password: "ap" })
  end

  def open_unrecorded(room)
    @api.create_meeting(room.name, room.key, record: false)
  end

  def open_unrecorded_braces(room)
    @api.create_meeting(room.name, room.key, { :record => false, :duration => 60 })
  end

  def join_url(room, user)
    @api.join_meeting_url(room.key, user.name, "ap")
  end

  def close(room)
    @api.end_meeting(room.key, "mp")
  end
end

class RawRequests
  # A request to a meeting server that turns recording off.
  def params(key, name)
    { meetingID: key, name: name, record: false, attendeePW: "ap", moderatorPW: "mp" }
  end

  def params_rocket(key, name)
    { :meetingID => key, :name => name, :record => false }
  end
end

class Inventory
  # A hash with a record key and no meeting in it.
  def entry(sku)
    { sku: sku, record: true, shelf: "A3" }
  end

  def vinyl(title)
    { title: title, record: "LP", speed: 33 }
  end

  def create_meeting(topic, record: true)
    "#{topic} #{record}"
  end
end
