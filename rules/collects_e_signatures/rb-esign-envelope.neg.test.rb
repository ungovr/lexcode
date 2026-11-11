# lexcode-expect: 0
# A checkbox that accepts terms is contract formation, not an electronic
# signature; request signing and webhook signatures are cryptography between
# machines; and an app's own methods may share the e-signature APIs' names.

class SignupsController < ApplicationController
  def create
    user = User.new(user_params.merge(terms_accepted_at: Time.current))
    user.save!
    redirect_to root_path
  end

  private

  def user_params
    params.require(:user).permit(:email, :password, :accept_terms)
  end
end

class WebhookVerifier
  def valid?(body, header, secret)
    expected = OpenSSL::HMAC.hexdigest("SHA256", secret, body)
    ActiveSupport::SecurityUtils.secure_compare(expected, header)
  end
end

# An in-house document workflow whose methods share names with a vendor's.
class InHouseSigner
  def create_envelope(document)
    { id: SecureRandom.uuid, document: document }
  end

  def send_signature_request(envelope, recipient)
    SigningMailer.invite(envelope, recipient).deliver_later
  end

  def run(document, recipient)
    envelope = create_envelope(document)
    send_signature_request(envelope, recipient)
  end
end

class Elsewhere
  def go(client, document)
    @http = Faraday.new(url: "https://api.example.org")
    client.create_envelope(document)
    @http.send_signature_request(document)
  end
end

# A note that names a vendor.
NOTE = "DocuSign_eSign::EnvelopesApi and Dropbox::Sign::SignatureRequestApi are not used here."
