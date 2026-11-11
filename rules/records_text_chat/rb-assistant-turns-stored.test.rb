# lexcode-expect: 7
# An assistant whose conversations are stored: each user turn and each model turn is written as a
# record with a role.
class AssistantMessagesController < ApplicationController
  def create
    @chat.messages.create!(role: "user", content: params[:content])
    reply = openai.chat(parameters: { model: "gpt-4o-mini", messages: @chat.messages.map { |m| { role: m.role, content: m.content } } })
    @chat.messages.create!(role: "assistant", content: reply.dig("choices", 0, "message", "content"))
    head :created
  end
end

class ConversationTurns
  def record(conversation, text, answer)
    conversation.messages.create(role: :user, content: text)
    Message.create!(conversation: conversation, role: :assistant, content: answer)
    ChatMessage.create(chat_id: conversation.id, role: "assistant", content: answer)
    conversation.messages.build(role: "user", content: text)
  end
end

class HashRocketTurns
  def record(chat, text)
    chat.messages.create!(:role => :user, :content => text)
  end
end
