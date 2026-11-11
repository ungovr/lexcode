# lexcode-expect: 0
# Video-meeting platform calls that record nothing: Zoom meeting and user listing, a
# Daily room with recording off, a Recall URL that is only documentation, and a hash
# with an enable_recording key set to false.
require "faraday"
require "json"

class ZoomDirectory
  BASE = "https://api.zoom.us/v2"

  def meetings(user_id, token)
    Faraday.get("https://api.zoom.us/v2/users/#{user_id}/meetings", nil, "Authorization" => "Bearer #{token}")
  end

  def profile(token)
    Faraday.get("#{BASE}/users/me", nil, "Authorization" => "Bearer #{token}")
  end

  def create(user_id, token, topic)
    Faraday.post("https://api.zoom.us/v2/users/#{user_id}/meetings", { topic: topic, type: 2 }.to_json,
                 "Authorization" => "Bearer #{token}")
  end
end

class DailyRooms
  def create(key, name)
    properties = { enable_chat: true, enable_recording: false }
    Faraday.post("https://api.daily.co/v1/rooms", { name: name, properties: properties }.to_json,
                 "Authorization" => "Bearer #{key}")
  end

  def private_room(name)
    { name: name, privacy: "private", properties: { "enable_recording" => "off" } }
  end
end

class HelpLinks
  RECALL_DOCS = "See https://docs.recall.ai/docs/getting-started for the bot overview"
  def docs
    RECALL_DOCS
  end
end
