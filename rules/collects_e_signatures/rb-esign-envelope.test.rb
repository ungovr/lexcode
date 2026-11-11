# lexcode-expect: 7
# Sending a document to a person for electronic signature through DocuSign,
# Dropbox Sign or HelloSign.

# DocuSign: the API object is built in the initializer and used in another method.
class SigningService
  def initialize(api_client)
    @envelopes_api = DocuSign_eSign::EnvelopesApi.new(api_client)
  end

  def send_agreement(account_id, definition)
    @envelopes_api.create_envelope(account_id, definition)
  end
end

# DocuSign: built and used in one method, with a leading scope operator.
class EnvelopeJob < ApplicationJob
  def perform(account_id, definition_id)
    api = ::DocuSign_eSign::EnvelopesApi.new(api_client)
    api.create_envelope(account_id, EnvelopeDefinition.find(definition_id).to_docusign)
  end
end

# DocuSign: built and called in one expression.
class QuickSend
  def call(client, account_id, definition)
    DocuSign_eSign::EnvelopesApi.new(client).create_envelope(account_id, definition)
  end
end

# HelloSign's older gem.
class LeaseSignatures
  def request(lease)
    client = HelloSign::Client.new(api_key: ENV.fetch("HELLOSIGN_API_KEY"))
    client.send_signature_request(
      title: "Lease for #{lease.unit}",
      subject: "Please sign your lease",
      signers: [{ email_address: lease.tenant_email, name: lease.tenant_name }],
      files: [lease.pdf_path]
    )
  end

  def from_template(lease)
    client = HelloSign::Client.new(api_key: ENV.fetch("HELLOSIGN_API_KEY"))
    client.send_signature_request_with_template(template_id: lease.template_id, signers: lease.signers)
  end
end

# Dropbox Sign's current SDK.
class OfferLetters
  def initialize
    @api = Dropbox::Sign::SignatureRequestApi.new
  end

  def send_letter(data)
    @api.signature_request_send(data)
  end
end

class OfferTemplates
  def send_from_template(data)
    api = Dropbox::Sign::SignatureRequestApi.new
    api.signature_request_send_with_template(data)
  end
end
