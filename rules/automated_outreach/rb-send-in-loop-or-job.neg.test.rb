# lexcode-expect: 0
# Mail a person asked for, in reply to what they just did (a Devise-style password reset, a
# confirmation, a receipt, a magic link), a retry loop around ONE message, a fallback over relays,
# and scheduled or looping code that contacts nobody.
require "net/smtp"

class PasswordResetsController < ApplicationController
  def create
    user = User.find_by(email: params[:email])
    UserMailer.with(user: user).reset_password.deliver_later if user
    head :no_content
  end
end

class ContactsController < ApplicationController
  def create
    contact = Contact.create!(contact_params)
    ContactMailer.with(contact: contact).receipt.deliver_now
    redirect_to root_path
  end
end

class RegistrationsController < ApplicationController
  def create
    @user = User.new(user_params)
    if @user.save
      UserMailer.confirm_email(@user).deliver_later
      TwilioClient.new.messages.create(to: @user.phone, from: "+15550100", body: "Your login code is #{@user.code}")
    end
  end
end

class User < ApplicationRecord
  def send_devise_notification(notification, *args)
    devise_mailer.send(notification, self, *args).deliver_now
  end
end

class MailerWithRetry
  def deliver(msg, recipient)
    # A retry loop around ONE message to ONE person is not a loop over recipients.
    attempts = 0
    begin
      attempts += 1
      Net::SMTP.start("localhost", 25) { |smtp| smtp.send_message(msg, "login@example.org", recipient) }
    rescue Errno::ECONNREFUSED
      retry if attempts < 3
    end
  end

  RELAYS = ["smtp-a.example.org", "smtp-b.example.org"].freeze

  def deliver_via_first_relay(msg, recipient)
    # A fallback over mail relays: one message to one person, whichever relay accepts it.
    RELAYS.each do |relay_host|
      Net::SMTP.start(relay_host, 587) { |smtp| smtp.send_message(msg, "login@example.org", recipient) }
      return relay_host
    rescue Errno::ECONNREFUSED
      next
    end
    nil
  end

  def deliver_with_attempts(mail)
    3.times do |attempt|
      mail.deliver_now
      return
    rescue Net::SMTPServerBusy
      sleep(attempt + 1)
    end
  end
end

class ReindexJob < ApplicationJob
  queue_as :default

  def perform
    # A job that sends nothing to anyone.
    Article.find_each { |article| article.reindex! }
  end
end

class QueueWorker
  include Sidekiq::Worker

  def perform(bodies)
    # SQS has a send_message too; it puts work on a queue and contacts nobody.
    bodies.each { |body| @sqs.send_message(queue_url: "https://sqs.us-west-2.amazonaws.com/1/jobs", message_body: body) }
  end
end

namespace :search do
  desc "Rebuilds the search index"
  task reindex: :environment do
    Article.find_each(&:reindex!)
  end
end

def build_messages(users)
  users.map { |user| { to: user.email, subject: "Hello" } }
end
