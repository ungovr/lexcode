# lexcode-expect: 10
# Messages sent from a queue worker, an ActiveJob or a notifier method, where the code does not show
# whether a person asked for each one.
class StatusChangeJob < ApplicationJob
  queue_as :default

  def perform(ticket_id)
    ticket = Ticket.find(ticket_id)
    TicketMailer.with(ticket: ticket).status_changed.deliver_now
  end
end

module Billing
  class ReminderJob < ActiveJob::Base
    def perform(invoice)
      InvoiceMailer.overdue(invoice).deliver_later
    end
  end
end

class ReminderWorker
  include Sidekiq::Worker

  def perform(appointment_id)
    appointment = Appointment.find(appointment_id)
    sms_client.messages.create(from: "+15550100", to: appointment.phone, body: "Reminder: your appointment is tomorrow.")
  end
end

class DigestWorker
  include Sidekiq::Job
  sidekiq_options queue: :mailers

  def perform(user_id)
    DigestMailer.with(user_id: user_id).weekly.deliver_later
  end
end

class AlertSender
  def self.perform(address)
    AlertMailer.alert(address).deliver_now
  end
end

class Subscription < ApplicationRecord
  def notify_subscribers(post)
    SubscriptionMailer.new_post(self, post).deliver_later
  end

  def send_weekly_digest
    DigestMailer.weekly(self).deliver_now
  end

  def remind_about_renewal
    sms_client.messages.create(from: "+15550100", to: phone, body: "Your plan renews on Friday.")
  end

  def broadcast_announcement(text)
    AnnouncementMailer.notice(self, text).deliver_later(wait: 5.minutes)
  end
end

class ParenlessReminderWorker
  include Sidekiq::Worker

  def perform(appointment_id)
    sms_client.messages.create from: "+15550100", to: Appointment.find(appointment_id).phone, body: "See you tomorrow."
  end
end
