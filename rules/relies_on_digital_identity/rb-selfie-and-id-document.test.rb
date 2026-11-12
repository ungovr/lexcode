# lexcode-expect: 8
# A face image held beside an image of a photo ID: the shape of
# document-and-selfie identity verification.

# A model that stores both images with Active Storage.
class IdentityVerification < ApplicationRecord
  belongs_to :user
  has_one_attached :selfie
  has_one_attached :id_document_front
  has_one_attached :id_document_back
end

# The upload controller permits both.
class IdentityVerificationsController < ApplicationController
  def create
    verification = current_user.identity_verifications.create!(verification_params)
    ReviewJob.perform_later(verification.id)
    redirect_to verification
  end

  private

  def verification_params
    params.require(:identity_verification).permit(:selfie, :passport_image, :country)
  end
end

# The hand-off to a verifier, in the shapes callers write a payload.
class VerifierClient
  def submit_hash(face, document)
    post("/checks", { selfie: face, id_document: document, reference: SecureRandom.uuid })
  end

  def submit_keywords(face, document)
    post("/checks", selfie: face, document_front: document)
  end

  def submit_strings(face, document)
    post("/checks", "face_image" => face, "passport_photo" => document)
  end

  def submit_document_first(face, document)
    post("/checks", id_card: document, liveness_capture: face)
  end

  def submit_rockets(face, document)
    post("/checks", :selfie => face, :identity_document => document)
  end
end

# Two attachments in one model that the check does not need: still one face
# image and one ID image, so the class matches once per face field.
class AgeCheck < ApplicationRecord
  mount_uploader :face_photo, ImageUploader
  mount_uploader :drivers_license_image, ImageUploader
end
