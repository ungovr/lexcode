# lexcode-expect: 0
class EmailLog < ApplicationRecord
  # A copy of a transactional email the site sent, kept for support.
  validates :sender, :recipient, :subject, presence: true
end

class Notification < ApplicationRecord
  belongs_to :sender, class_name: "User"
  belongs_to :recipient, class_name: "User"
end

class SupportTicketMessage < ApplicationRecord
  # A comment on a ticket that only the staff handling it read.
  belongs_to :user
  belongs_to :ticket
end

class SupportChatMessage < ApplicationRecord
  # An in-app support chat: one customer, staff answering.
  belongs_to :conversation
  belongs_to :user
end

class AiChatMessage < ApplicationRecord
  # The history of one person's chat with an assistant.
  belongs_to :chat_room
  belongs_to :user
  enum :role, { user: 0, assistant: 1 }
end

class OutboundMessage < ApplicationRecord
  # A CRM message sent to a contact.
  belongs_to :user
  belongs_to :recipient, class_name: "Contact"
end

class Admin < ApplicationRecord
  belongs_to :recipient, class_name: "User"
  belongs_to :author, class_name: "User"
end

class LobbyChannel < ApplicationCable::Channel
  def subscribed
    stream_from "lobby"
  end
end

class NotificationsChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end
end
