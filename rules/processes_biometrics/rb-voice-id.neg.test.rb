# lexcode-expect: 0
# Amazon Connect and Transcribe calls that do not enroll or match a speaker, and local
# classes with the same method names.
require "aws-sdk-connect"
require "aws-sdk-transcribeservice"

class ContactCenterStatus
  def initialize
    @connect = Aws::Connect::Client.new(region: "us-west-2")
  end

  def queues(instance_id)
    @connect.list_queues(instance_id: instance_id)
  end

  def agent(instance_id, user_id)
    @connect.describe_user(instance_id: instance_id, user_id: user_id)
  end
end

class TranscriptsOnly
  def forget(name)
    Aws::TranscribeService::Client.new.delete_transcription_job(transcription_job_name: name)
  end
end

class Interview
  def evaluate_session(session, rubric)
    session.scores.sum { |score| rubric.fetch(score.id, 0) }
  end
end

class Panel
  def run(session, rubric)
    Interview.new.evaluate_session(session, rubric)
  end
end
