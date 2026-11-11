# lexcode-expect: 3
# Local speech recognition with the whispercpp gem: a model is loaded in the Rails
# process and recorded audio is transcribed on the server.
require "whisper"

class LocalTranscriber
  MODEL = "base.en"

  def initialize
    @whisper = Whisper::Context.new(MODEL)
  end

  def transcribe(path)
    params = Whisper::Params.new(language: "en")
    text = +""
    @whisper.transcribe(path, params) { |whole| text << whole }
    text
  end
end

class MeetingAudioJob < ApplicationJob
  queue_as :transcription

  def perform(meeting_id)
    meeting = Meeting.find(meeting_id)
    context = Whisper::Context.new("small")
    meeting.audio.blob.open do |file|
      meeting.update!(transcript: context.transcribe(file.path, Whisper::Params.new).to_s)
    end
  end
end

# Whisper::Context.new written with a block still loads the model.
module Captions
  def self.engine
    Whisper::Context.new("tiny") { |ctx| ctx }
  end
end
