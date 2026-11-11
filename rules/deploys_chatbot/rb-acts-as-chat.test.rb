# lexcode-expect: 3
# Models that RubyLLM turns into a chat with a language model, with the conversation kept in tables.
class Chat < ApplicationRecord
  acts_as_chat
  belongs_to :user, optional: true
end

class SupportChat < ApplicationRecord
  acts_as_chat messages: :support_messages, model: :llm_model
end

module Assistants
  class Thread < ApplicationRecord
    acts_as_chat(message_class: "Assistants::Entry")
  end
end
