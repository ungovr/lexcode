# lexcode-expect: 6
# Checking who a person is with an identity-verification service.

# Stripe Identity: a document-and-selfie check started from a controller.
class IdentityChecksController < ApplicationController
  def create
    session = Stripe::Identity::VerificationSession.create(
      type: "document",
      options: { document: { require_matching_selfie: true } },
      metadata: { user_id: current_user.id }
    )
    render json: { client_secret: session.client_secret }
  end

  def webhook
    report = Stripe::Identity::VerificationReport.retrieve(params[:report_id])
    current_user.update!(identity_status: report.status)
    head :ok
  end
end

# The same call written with a leading scope operator, inside a job.
class StartVerificationJob < ApplicationJob
  def perform(user_id)
    ::Stripe::Identity::VerificationSession.create(type: "document", metadata: { user_id: user_id })
  end
end

# Onfido's Ruby client, current and older.
class OnfidoChecks
  def initialize
    Onfido.configure { |config| config.api_token = ENV.fetch("ONFIDO_API_TOKEN") }
    @api = Onfido::DefaultApi.new
  end

  def applicant(first_name, last_name)
    @api.create_applicant(first_name: first_name, last_name: last_name)
  end
end

class LegacyOnfido
  def client
    @client ||= Onfido::API.new
  end
end

# Veriff's gem: a session the person completes in the vendor's flow.
class VeriffSessions
  def start
    session = Veriff::Session.create
    session.url
  end
end
