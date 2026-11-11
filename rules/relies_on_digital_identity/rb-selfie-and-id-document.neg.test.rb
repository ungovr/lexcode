# lexcode-expect: 0
# A profile photo, a gallery that links photos by id, a password sign-in, a
# social sign-in that only links an account, and an ID scan with no face beside
# it: nothing here holds a face image next to a photo-ID image.

class Profile < ApplicationRecord
  has_one_attached :selfie
  has_one_attached :avatar
  has_one_attached :banner
end

class TravelDocument < ApplicationRecord
  has_one_attached :passport_image
  has_one_attached :visa_page
end

class Gallery < ApplicationRecord
  has_one_attached :selfie
  belongs_to :photo
  attribute :photo_id, :integer
end

class ProfilesController < ApplicationController
  def update
    current_user.update!(params.require(:profile).permit(:selfie, :display_name, :bio))
  end

  def upload_document
    current_user.travel_documents.create!(params.require(:document).permit(:passport_image, :country))
  end
end

class LoginService
  def sign_in(email, password)
    client.post("/api/login", { email: email, password: password })
  end

  def link_google(profile)
    { google_id: profile.id, profile_image: profile.picture, face_image_url: profile.picture }
  end

  def upload_avatar(face_blob)
    client.post("/api/me/photo", selfie: face_blob, caption: "me")
  end

  def scan_document(scan)
    client.post("/api/documents", { "id_document" => scan, "label" => "passport" })
  end
end
