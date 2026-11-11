# lexcode-expect: 7
# Ruby apps that identify or verify a person from a face or a voice over a vendor's
# REST API: Azure Face, Face++ and VoiceIt.
require "faraday"
require "json"

class AzureFaceMatcher
  def initialize(endpoint, key)
    @endpoint = endpoint
    @key = key
  end

  def identify(face_ids, group_id)
    Faraday.post("#{@endpoint}/face/v1.0/identify", { faceIds: face_ids, personGroupId: group_id }.to_json,
                 "Ocp-Apim-Subscription-Key" => @key, "Content-Type" => "application/json")
  end

  def verify(face_id, other_face_id)
    Faraday.post("#{@endpoint}/face/v1.0/verify", { faceId1: face_id, faceId2: other_face_id }.to_json,
                 "Ocp-Apim-Subscription-Key" => @key, "Content-Type" => "application/json")
  end

  def enroll(group_id, name)
    Faraday.post("#{@endpoint}/face/v1.0/persongroups/#{group_id}/persons", { name: name }.to_json,
                 "Ocp-Apim-Subscription-Key" => @key, "Content-Type" => "application/json")
  end
end

class FacePlusPlus
  def compare(key, secret, token1, token2)
    Faraday.post("https://api-us.faceplusplus.com/facepp/v3/compare",
                 { api_key: key, api_secret: secret, face_token1: token1, face_token2: token2 })
  end

  def search(key, secret, token, outer_id)
    Faraday.post("https://api-us.faceplusplus.com/facepp/v3/search",
                 { api_key: key, api_secret: secret, face_token: token, outer_id: outer_id })
  end
end

class VoiceItVerifier
  def enroll_voice(user_id, path, auth)
    Faraday.post("https://api.voiceit.io/enrollments/voice", { userId: user_id, recording: File.open(path) }, auth)
  end

  def verify_voice(user_id, path, auth)
    uri = URI("https://api.voiceit.io/verification/voice")
    Net::HTTP.post_form(uri, userId: user_id, recording: File.read(path))
  end
end
