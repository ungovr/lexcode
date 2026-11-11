# lexcode-expect: 0
# Single sends and batch calls that contact nobody: one templated email, a batch of queue messages,
# a batch of log rows.
class ReceiptsController < ApplicationController
  def create
    ses = Aws::SES::Client.new(region: "us-west-2")
    ses.send_templated_email(source: "hi@example.org", destination: { to_addresses: [params[:email]] }, template: "receipt")
  end
end

class QueueBatcher
  def flush(bodies)
    sqs.send_message_batch(queue_url: ENV["QUEUE_URL"], entries: bodies.each_with_index.map { |b, i| { id: i.to_s, message_body: b } })
  end
end

class AuditLog
  def flush(rows)
    AuditEntry.insert_all(rows)
    Resend::Webhooks.verify(payload: rows.to_json)
  end
end

class SinglePostmark
  def deliver(user)
    postmark.deliver(from: "hi@example.org", to: user.email, subject: "Your receipt", text_body: "Thanks")
  end
end
