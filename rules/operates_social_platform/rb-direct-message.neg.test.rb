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
