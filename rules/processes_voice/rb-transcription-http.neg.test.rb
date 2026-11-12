# lexcode-expect: 0
# HTTP calls to the same vendors that carry no speech to be recognized: Deepgram's
# project listing, OpenAI chat and speech synthesis, and ElevenLabs text-to-speech.
# URLs that only look alike, and a speech page that is only linked.
require "net/http"
require "faraday"

class VendorStatus
  DEEPGRAM_PROJECTS = "https://api.deepgram.com/v1/projects"
  OPENAI_CHAT = "https://api.openai.com/v1/chat/completions"
  OPENAI_SPEECH = "https://api.openai.com/v1/audio/speech"
  ELEVEN_VOICES = "https://api.elevenlabs.io/v1/voices"
  ELEVEN_TTS = "https://api.elevenlabs.io/v1/text-to-speech/voice-id"
  ASSEMBLY_ACCOUNT = "https://api.assemblyai.com/v2/account"
  SPEECH_DOCS = "https://developers.deepgram.com/docs/listen"

  def projects(key)
    Faraday.get(DEEPGRAM_PROJECTS, nil, "Authorization" => "Token #{key}")
  end

  def chat(key, prompt)
    Faraday.post(OPENAI_CHAT, { model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] }.to_json,
                 "Authorization" => "Bearer #{key}", "Content-Type" => "application/json")
  end

  def speak(key, text)
    Net::HTTP.post(URI(OPENAI_SPEECH), { model: "tts-1", input: text, voice: "alloy" }.to_json,
                   "Authorization" => "Bearer #{key}")
  end

  def voices(key)
    Faraday.get(ELEVEN_VOICES, nil, "xi-api-key" => key)
  end

  def speak_eleven(key, text)
    Faraday.post(ELEVEN_TTS, { text: text }.to_json, "xi-api-key" => key)
  end

  def account(key)
    Faraday.get(ASSEMBLY_ACCOUNT, nil, "Authorization" => key)
  end

  # Not an API call: a help link shown to the user.
  def help_url
    SPEECH_DOCS
  end
end
