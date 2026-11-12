# lexcode-expect: 6
# Ruby code that records or reads recorded video meetings through the platform's
# API: Zoom cloud recordings, a Recall.ai notetaker bot, and Daily cloud recording.
require "faraday"
require "json"

class ZoomRecordings
  def for_meeting(meeting_id, token)
    Faraday.get("https://api.zoom.us/v2/meetings/#{meeting_id}/recordings", nil, "Authorization" => "Bearer #{token}")
  end

  def for_user(user_id, token, from)
    Faraday.get("https://api.zoom.us/v2/users/#{user_id}/recordings?from=#{from}", nil, "Authorization" => "Bearer #{token}")
  end

  def for_account(account_id, token)
    uri = URI("https://api.zoom.us/v2/accounts/#{account_id}/recordings")
    Net::HTTP.get(uri, "Authorization" => "Bearer #{token}")
  end
end

class NotetakerBot
  def join(meeting_url, key)
    Faraday.post("https://us-east-1.recall.ai/api/v1/bot/", { meeting_url: meeting_url }.to_json,
                 "Authorization" => "Token #{key}", "Content-Type" => "application/json")
  end
end

class DailyRoomCreator
  def create(key, name)
    properties = { enable_chat: true, enable_recording: "cloud" }
    Faraday.post("https://api.daily.co/v1/rooms", { name: name, properties: properties }.to_json,
                 "Authorization" => "Bearer #{key}")
  end

  def token(key, room)
    body = { properties: { "room_name" => room, "enable_recording" => "raw-tracks" } }
    Faraday.post("https://api.daily.co/v1/meeting-tokens", body.to_json, "Authorization" => "Bearer #{key}")
  end
end
