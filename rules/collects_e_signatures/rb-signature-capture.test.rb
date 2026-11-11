# lexcode-expect: 14
# Storing a signature a person drew or captured, as a record on the agreement.

# Active Storage: the signature pad's image is attached to the waiver.
class Waiver < ApplicationRecord
  belongs_to :participant
  has_one_attached :signature
  validates :signature, presence: true
end

class Lease < ApplicationRecord
  has_one_attached :tenant_signature
  has_one_attached :guarantor_signature_image
end

# Older upload gems.
class Consent < ApplicationRecord
  has_attached_file :signature, styles: { thumb: "200x80>" }
  mount_uploader :patient_signature, SignatureUploader
end

# A signature pad posts a data URL; the controller decodes it and stores it.
class WaiversController < ApplicationController
  def sign
    waiver = Waiver.find(params[:id])
    png = Base64.decode64(params[:signature_data].to_s.split(",").last)
    waiver.signature.attach(io: StringIO.new(png), filename: "signature.png", content_type: "image/png")
    waiver.update!(signed_at: Time.current, signed_ip: request.remote_ip)
    redirect_to waiver, notice: "Thank you for signing"
  end
end

class QuoteApprovals
  def approve(quote, io)
    quote.customer_signature.attach(io: io, filename: "approval.png")
  end
end

# The agreement word anywhere in the class name: a suffix, a prefix, a namespace.
class EventWaiver < ApplicationRecord
  has_one_attached :signature
end

class SignedWaiver < ApplicationRecord
  has_one_attached :signature
end

class ServiceAgreement < ApplicationRecord
  has_one_attached :signer_signature
end

class EmploymentContract < ApplicationRecord
  has_one_attached :signature
end

class InformedConsent < ApplicationRecord
  has_one_attached :patient_signature
end

module Legal
  class Waiver < ApplicationRecord
    has_one_attached :signature
  end
end

module Admin
  class ParticipantWaiversController < ApplicationController
    def sign
      @waiver.signature.attach(io: StringIO.new(png), filename: "signature.png")
    end
  end
end
