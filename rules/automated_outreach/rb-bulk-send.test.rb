# lexcode-expect: 9
# One call that sends a message to many recipients: SES bulk sends, Resend batches, Postmark
# batches, a Mailgun batch, a Mailchimp campaign, Twilio Notify.
class Newsletter
  def ses_bulk(destinations)
    ses = Aws::SES::Client.new(region: "us-west-2")
    ses.send_bulk_templated_email(source: "news@example.org", template: "monthly", destinations: destinations, default_template_data: "{}")
  end

  def ses_v2_bulk(entries)
    sesv2.send_bulk_email(from_email_address: "news@example.org", default_content: { template: { template_name: "monthly" } }, bulk_email_entries: entries)
  end

  def resend_batch(messages)
    Resend::Batch.send(messages)
  end

  def postmark_batch(messages)
    postmark.deliver_in_batches(messages)
  end

  def postmark_messages(messages)
    postmark.deliver_messages(messages)
  end

  def mailgun_batch(recipients)
    batch = Mailgun::BatchMessage.new(mailgun, "example.org")
    batch.from("news@example.org")
    recipients.each { |r| batch.add_recipient(:to, r) }
    batch.finalize
  end

  def mailchimp(campaign_id)
    mailchimp_client.campaigns.send(campaign_id)
  end

  # A client built inline, its constructor over several lines.
  def mailchimp_inline(campaign_id)
    MailchimpMarketing::Client.new(
      api_key: ENV["MAILCHIMP_KEY"]
    ).campaigns.send(campaign_id)
  end

  def notify(identities)
    twilio.notify.services(ENV["NOTIFY_SID"]).notifications.create(identity: identities, body: "Hello")
  end
end
