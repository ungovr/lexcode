# lexcode-expect: 0
# Face and voice vendor endpoints that do not match a person: Azure Face detection
# alone, Face++ detection, a VoiceIt account page, and links shown to users.
require "faraday"
require "json"

class FaceDetection
  def detect(endpoint, key, image_url)
    Faraday.post("#{endpoint}/face/v1.0/detect?returnFaceId=false", { url: image_url }.to_json,
                 "Ocp-Apim-Subscription-Key" => key, "Content-Type" => "application/json")
  end

  def facepp_detect(key, secret, image_url)
    Faraday.post("https://api-us.faceplusplus.com/facepp/v3/detect", { api_key: key, api_secret: secret, image_url: image_url })
  end
end

class VoiceItAccount
  def documentation
    "https://api.voiceit.io/docs"
  end

  def sign_in_help
    "Learn how Azure Face verify works at https://learn.microsoft.com/azure/ai-services/computer-vision/overview-identity"
  end
end

class PhotoGallery
  # Ordinary photos a user uploads and a gallery shows.
  def upload(user, file)
    user.photos.attach(file)
  end

  def thumbnail(photo)
    photo.variant(resize_to_limit: [200, 200])
  end
end
