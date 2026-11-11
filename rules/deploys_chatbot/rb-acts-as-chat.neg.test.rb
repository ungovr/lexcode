# lexcode-expect: 0
# Other acts_as helpers, a message table with no model behind it, and a one-shot RubyLLM call.
class Task < ApplicationRecord
  acts_as_list scope: :project
  acts_as_paranoid
end

class Note < ApplicationRecord
  belongs_to :author
  validates :body, presence: true
end

class TitleSuggester
  def call(text)
    # One question, one answer, no conversation object.
    RubyLLM.chat.ask("Suggest a title for: #{text}").content
  end
end
