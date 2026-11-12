# lexcode-expect: 5
# Gems that keep the conversation: RubyLLM's chat and message models, and Mailboxer's replies.
class Chat < ApplicationRecord
  acts_as_chat
  belongs_to :user
end

class ChatMessage < ApplicationRecord
  acts_as_message chat: :chat
end

class InboxController < ApplicationController
  def reply
    current_user.reply_to_conversation(@conversation, params[:body])
    current_user.reply_to_all(@receipt, params[:body])
    current_user.reply_to_sender(@receipt, params[:body])
  end
end
