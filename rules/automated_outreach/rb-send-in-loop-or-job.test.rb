# lexcode-expect: 21
# Mail and texts the program sends on its own: once per recipient in a loop, and from a rake task
# or a scheduler block that no user action triggers.
class DigestsController < ApplicationController
  def deliver_all
    Subscriber.active.find_each do |subscriber|
      DigestMailer.with(subscriber: subscriber).weekly.deliver_later
    end
    head :accepted
  end
end

class AnnouncementService
  def call(announcement, users)
    users.each do |user|
      AnnouncementMailer.notice(user, announcement).deliver_now
    end
    users.each { |user| AnnouncementMailer.with(user: user).notice.deliver_later(wait: 1.hour) }
    for user in users
      AnnouncementMailer.notice(user, announcement).deliver_now!
    end
  end
end

class TextEveryone
  def run(phones)
    client = Twilio::REST::Client.new(ENV["TWILIO_SID"], ENV["TWILIO_TOKEN"])
    phones.each do |phone|
      client.messages.create(from: "+15550100", to: phone, body: "Your trash pickup moves to Tuesday.")
    end
    phones.each_with_index do |phone, i|
      client.calls.create(from: "+15550100", to: phone, url: "https://example.org/voice/#{i}")
    end
  end
end

class SesLoop
  def run(addresses)
    ses = Aws::SES::Client.new(region: "us-west-2")
    addresses.each do |address|
      ses.send_email(
        source: "hi@example.org",
        destination: { to_addresses: [address] },
        message: { subject: { data: "Hi" }, body: { text: { data: "Hi" } } }
      )
    end
    addresses.each { |address| ses.send_templated_email(source: "hi@example.org", destination: { to_addresses: [address] }, template: "t") }
  end
end

class OtherVendors
  def run(users, postmark, resend, mailgun)
    users.each do |user|
      postmark.deliver(from: "hi@example.org", to: user.email, subject: "Hi", text_body: "Hi")
      postmark.deliver_with_template(from: "hi@example.org", to: user.email, template_alias: "reminder")
      Resend::Emails.send(from: "hi@example.org", to: user.email, subject: "Hi", html: "<p>Hi</p>")
      mailgun.send_message("example.org", from: "hi@example.org", to: user.email, subject: "Hi", text: "Hi")
    end
  end
end

class Mailers
  def run(users)
    users.each_slice(100) do |batch|
      batch.each { |user| UserMailer.reminder(user).deliver }
    end
    users.map { |user| UserMailer.reminder(user).deliver_later }
    users.select(&:active?).each do |user|
      Net::SMTP.start("localhost", 25) { |smtp| smtp.send_message(build(user), "hi@example.org", user.email) }
    end
  end
end

# ---- rake tasks and schedulers ----
namespace :reports do
  desc "Mails the nightly status to the team (run from cron)"
  task nightly_status: :environment do
    StatusMailer.nightly(Team.all).deliver_now
  end

  task :remind do
    ReminderMailer.with(list: "all").daily.deliver_later
  end
end

task send_digest: :environment do
  DigestMailer.weekly.deliver_now
end

class Scheduler
  def start
    scheduler = Rufus::Scheduler.new
    scheduler.every "1d" do
      StatusMailer.nightly.deliver_later
    end
    scheduler.cron "0 9 * * mon" do
      sms_client.messages.create(from: "+15550100", to: "+15550101", body: "Weekly check-in")
    end
  end
end

Clockwork.every(1.day, "digest") do
  DigestMailer.weekly.deliver_now
end
