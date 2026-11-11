# lexcode-expect: 3
# Voiceprint enrollment and matching with Amazon Connect Voice ID: a caller's voice is
# enrolled, a known fraudster's voice is registered, and a live session is scored
# against the enrolled print.
require "aws-sdk-voiceid"

class CallerVerification
  def initialize
    @voice_id = Aws::VoiceID::Client.new(region: "us-west-2")
  end

  def enroll(domain_id, data_access_role_arn, input_uri, output_uri)
    @voice_id.start_speaker_enrollment_job(
      domain_id: domain_id,
      data_access_role_arn: data_access_role_arn,
      input_data_config: { s3_uri: input_uri },
      output_data_config: { s3_uri: output_uri }
    )
  end

  def register_fraudster(domain_id, role_arn, input_uri, output_uri, watchlist_id)
    @voice_id.start_fraudster_registration_job(
      domain_id: domain_id,
      data_access_role_arn: role_arn,
      input_data_config: { s3_uri: input_uri },
      output_data_config: { s3_uri: output_uri },
      registration_config: { watchlist_ids: [watchlist_id] }
    )
  end

  def score(domain_id, session_name)
    @voice_id.evaluate_session(domain_id: domain_id, session_name_or_id: session_name)
  end
end
