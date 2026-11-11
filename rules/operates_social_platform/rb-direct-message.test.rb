# lexcode-expect: 5
class DirectMessage < ApplicationRecord
  belongs_to :sender, class_name: "User"
  belongs_to :recipient, class_name: "User"

  scope :unread, -> { where(read_at: nil) }
end

class PrivateMessage < ApplicationRecord
  belongs_to :from_user, class_name: "User"
  belongs_to :to_user, class_name: "User"
end

class ChatMessage < ApplicationRecord
  belongs_to :conversation
  belongs_to :author, class_name: "User"
  validates :body, presence: true
end

class Messages::Message < ApplicationRecord
  belongs_to :chat_room
  belongs_to :user
end

class DirectMessageChannel < ApplicationCable::Channel
  def subscribed
    stream_for current_user
  end

  def speak(data)
    DirectMessage.create!(sender: current_user, recipient_id: data["to"], body: data["body"])
  end
end
