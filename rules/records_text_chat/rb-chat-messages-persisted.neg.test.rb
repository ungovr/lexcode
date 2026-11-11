# lexcode-expect: 0
# A chat endpoint that answers and keeps nothing, a contact form saved to a table, a feedback row,
# a model written from no request, and a channel that relays and keeps nothing.
class ChatsController < ApplicationController
  def create
    # The turn goes to the model and back to the caller. No history is stored.
    reply = openai.chat(parameters: { model: "gpt-4o-mini", messages: params[:messages] })
    render json: { reply: reply.dig("choices", 0, "message", "content") }
  end
end

class ContactsController < ApplicationController
  def create
    # A form the app only saves is not a chat.
    ContactRequest.create!(email: params[:email], subject: params[:subject], message: params[:message])
    redirect_to root_path
  end
end

class FeedbackController < ApplicationController
  def create
    Feedback.create!(rating: params[:rating], comment: params[:comment])
    head :created
  end

  def count
    total = params[:messages].sum { |m| m[:content].split.size }
    Feedback.create!(rating: [total, 5].min, comment: "length check")
  end
end

class PostsController < ApplicationController
  def create
    # A forum post is a document, not a chat message.
    Post.create!(title: params[:title], body: params[:body], author: current_user)
  end
end

class WelcomeJob < ApplicationJob
  def perform(user_id)
    # A system-written conversation row: nothing a person typed.
    Conversation.create!(user_id: user_id, subject: "Welcome")
    ChatMessage.create!(conversation: Conversation.last, content: "Welcome aboard")
  end
end

class RelayChannel < ApplicationCable::Channel
  def receive(data)
    # Relays what was typed to everyone and stores nothing.
    ActionCable.server.broadcast("room_#{params[:room]}", message: data["message"])
  end

  def preview(data)
    # Builds a record to render, and never saves it.
    draft = Message.new(content: data["message"])
    transmit(html: render_message(draft))
  end
end
