# lexcode-expect: 4
# Starting a LiveKit egress that records the people in a room: a room composite, a
# participant, a track composite and a single track, from a service object and a job.
require "livekit"

class RoomRecorder
  def initialize
    @egress = LiveKit::EgressServiceClient.new(
      "https://example.livekit.cloud", api_key: ENV.fetch("LK_KEY"), api_secret: ENV.fetch("LK_SECRET")
    )
  end

  def record_room(room_name)
    output = LiveKit::Proto::EncodedFileOutput.new(filepath: "recordings/#{room_name}.mp4")
    @egress.start_room_composite_egress(room_name, output)
  end

  def record_participant(room_name, identity)
    output = LiveKit::Proto::EncodedFileOutput.new(filepath: "recordings/#{identity}.mp4")
    @egress.start_participant_egress(room_name, identity, output)
  end

  def record_tracks(room_name, audio_track_id, video_track_id)
    output = LiveKit::Proto::EncodedFileOutput.new(filepath: "recordings/#{room_name}.mp4")
    @egress.start_track_composite_egress(room_name, output, audio_track_id: audio_track_id, video_track_id: video_track_id)
  end
end

class TrackEgressJob < ApplicationJob
  def perform(room_name, track_id, output)
    api = LiveKit::LiveKitAPI.new("https://example.livekit.cloud", api_key: ENV.fetch("LK_KEY"), api_secret: ENV.fetch("LK_SECRET"))
    api.egress.start_track_egress(room_name, output, track_id)
  end
end
