# lexcode-expect: 0
# Other acts_as helpers, a mailer reply, and a model that only validates a message form.
class Task < ApplicationRecord
  acts_as_list scope: :project
end

class SupportMailer < ApplicationMailer
  def reply_to_sender(ticket)
    mail(to: ticket.email, subject: "Re: #{ticket.subject}")
  end
end

class ContactForm
  include ActiveModel::Model
  attr_accessor :email, :message
  validates :message, presence: true
end
