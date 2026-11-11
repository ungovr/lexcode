# lexcode-expect: 0
# Things named "signature" that no person signs: an email footer, a request
# signature, a webhook signature column, a digital (cryptographic) signature,
# and attachments that are not a drawn or captured signature.

class Mailer < ApplicationRecord
  has_one_attached :email_signature
  has_one_attached :logo
  has_one_attached :avatar
end

class WebhookEvent < ApplicationRecord
  attribute :signature, :string

  def valid_signature?(secret)
    OpenSSL::HMAC.hexdigest("SHA256", secret, payload) == signature
  end
end

class Release < ApplicationRecord
  has_one_attached :digital_signature
  has_one_attached :signature_key
  has_one_attached :checksum
end

class Contract < ApplicationRecord
  has_one_attached :agreement_pdf
  has_one_attached :terms
  mount_uploader :cover_image, ImageUploader
  mount_uploader :signatures_report, ReportUploader
end

class ReportsController < ApplicationController
  def attach_logo
    @mailer.logo.attach(io: File.open(params[:path]), filename: "logo.png")
    @mailer.email_signature.attach(params[:footer])
  end
end

# A bare "signature" on a record that is not an agreement: a profile signature
# image under forum posts, a detached signature of a released package, and the
# footer of an email template. None is a person signing a document.
class User < ApplicationRecord
  has_one_attached :signature
  mount_uploader :user_signature, SignatureImageUploader
end

class PackageVersion < ApplicationRecord
  has_one_attached :signature
  has_one_attached :archive
end

class EmailTemplate < ApplicationRecord
  has_attached_file :signature, styles: { footer: "600x120>" }
end

class PackagesController < ApplicationController
  def attach_signature
    @package.signature.attach(params[:sig])
    current_user.signature.attach(io: File.open(params[:path]), filename: "sig.png")
  end
end

# A method named signature on the app's own class, with no attachment.
class Request
  def signature
    Digest::SHA256.hexdigest(body)
  end
end
