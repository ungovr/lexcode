# lexcode-expect: 6
# Ruby apps that send recorded speech to a transcription vendor over plain HTTP,
# with Faraday, Net::HTTP and HTTParty.
require "faraday"
require "net/http"
require "httparty"

class DeepgramTranscriber
  ENDPOINT = "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true"

  def transcribe(path, key)
    Faraday.post(ENDPOINT, File.binread(path), "Authorization" => "Token #{key}", "Content-Type" => "audio/wav")
  end
end

class WhisperOverHttp
  def transcribe(path, key)
    uri = URI("https://api.openai.com/v1/audio/transcriptions")
    request = Net::HTTP::Post.new(uri, "Authorization" => "Bearer #{key}")
    request.set_form([["file", File.open(path)], ["model", "whisper-1"]], "multipart/form-data")
    Net::HTTP.start(uri.host, uri.port, use_ssl: true) { |http| http.request(request) }
  end

  def translate(path, key)
    HTTParty.post("https://api.openai.com/v1/audio/translations", headers: { "Authorization" => "Bearer #{key}" },
                  body: { file: File.open(path), model: "whisper-1" })
  end
end

class AssemblyOverHttp
  def start(audio_url, key)
    Faraday.post("https://api.assemblyai.com/v2/transcript", { audio_url: audio_url }.to_json, "Authorization" => key)
  end
end

class ElevenLabsScribe
  def transcribe(path, key)
    Faraday.post("https://api.elevenlabs.io/v1/speech-to-text", { file: File.open(path) }, "xi-api-key" => key)
  end
end

class GoogleRest
  def recognize(body, token)
    Faraday.post("https://speech.googleapis.com/v1/speech:recognize", body.to_json, "Authorization" => "Bearer #{token}")
  end
end
