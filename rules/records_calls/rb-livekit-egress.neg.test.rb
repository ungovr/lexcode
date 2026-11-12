# lexcode-expect: 0
# LiveKit server calls that do not record the people in a room: tokens, room
# management, a web-page egress that captures a page and no participant, and a
# local object with an egress-like method.
require "livekit"

class RoomAdmin
  def initialize
    @rooms = LiveKit::RoomServiceClient.new("https://example.livekit.cloud", api_key: ENV.fetch("LK_KEY"), api_secret: ENV.fetch("LK_SECRET"))
  end

  def token_for(user)
    token = LiveKit::AccessToken.new(api_key: ENV.fetch("LK_KEY"), api_secret: ENV.fetch("LK_SECRET"))
    token.identity = user.id.to_s
    token.add_grant(roomJoin: true, room: "town-hall")
    token.to_jwt
  end

  def open(name)
    @rooms.create_room(name)
  end

  def participants(name)
    @rooms.list_participants(room: name)
  end

  def remove(name, identity)
    @rooms.remove_participant(room: name, identity: identity)
  end
end

class EgressStatus
  def initialize(client)
    @egress = client
  end

  # Reading the list of egresses and stopping one does not start a recording.
  def list(room_name)
    @egress.list_egress(room_name: room_name)
  end

  def stop(egress_id)
    @egress.stop_egress(egress_id)
  end

  # Capturing a web page to a file records no call.
  def snapshot_page(url, output)
    @egress.start_web_egress(url, output)
  end
end

class Exporter
  def start_room_report(room)
    "report for #{room}"
  end
end
