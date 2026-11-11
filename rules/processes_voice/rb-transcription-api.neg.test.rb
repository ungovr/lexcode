# lexcode-expect: 0
# Calls that sound like speech recognition and are not: the same vendors' text and
# speech-synthesis calls, a text-only Google request, and local classes with a
# transcribe or recognize method of their own.
require "openai"
require "aws-sdk-polly"
require "aws-sdk-transcribeservice"

class ReplyWriter
  def initialize(client)
    @client = client
  end

  # Text in, text out: no voice anywhere.
  def draft(prompt)
    @client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] })
  end

  # Speech synthesis reads typed text aloud; a person's voice is never an input.
  def read_aloud(text)
    @client.audio.speech(parameters: { model: "tts-1", input: text, voice: "alloy" })
  end
end

class Narrator
  def speak(text)
    polly = Aws::Polly::Client.new(region: "us-east-1")
    polly.synthesize_speech(text: text, voice_id: "Joanna", output_format: "mp3")
  end

  # Listing and deleting jobs do not send any audio for recognition.
  def jobs
    Aws::TranscribeService::Client.new.list_transcription_jobs(max_results: 10)
  end

  def forget(name)
    Aws::TranscribeService::Client.new.delete_transcription_job(transcription_job_name: name)
  end
end

# A local class with the same method names as the speech vendors.
class Transcript
  def initialize(rows)
    @rows = rows
  end

  def transcribe(width)
    @rows.map { |row| row.strip.ljust(width) }
  end

  def recognize(token)
    @rows.include?(token)
  end
end

class RowImporter
  def run(rows)
    Transcript.new(rows).transcribe(80)
    Transcript.new(rows).recognize("header")
  end
end

module Google
  module Cloud
    module Language
      # A Google client that takes text, not audio.
      def self.sentiment(text)
        request = Google::Cloud::Language::V1::AnalyzeSentimentRequest.new(document: { content: text, type: :PLAIN_TEXT })
        request
      end
    end
  end
end
