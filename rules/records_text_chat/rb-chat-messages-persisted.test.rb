# lexcode-expect: 12
# Chat endpoints and channels that keep the conversation: what a person typed is written to a
# database.
class MessagesController < ApplicationController
  def create
    @message = @conversation.messages.create!(body: params[:body], user: current_user)
    render json: @message
  end

  def room
    ChatMessage.create!(room: @room, user: current_user, content: params[:message][:content])
    head :created
  end

  def strong
    @chat.messages.create(message_params)
    head :created
  end

  def transcript
    Conversation.create!(user: current_user, transcript: params[:messages])
    head :created
  end

  def inbox
    conversation.add_message(params[:body], user: current_user)
    head :created
  end

  private

  def message_params
    params.require(:message).permit(:body)
  end
end

class RoomChannel < ApplicationCable::Channel
  def receive(data)
    Message.create!(content: data["message"], user: current_user, room_id: params[:room_id])
  end

  def speak(data)
    @room.messages.create(body: data.fetch("body"), user: current_user)
  end
end

# Shapes the anchor must admit: a leading-dot chain, a trailing dot and safe navigation.
class ChainShapesMessages < ApplicationController
  def create
    @message = @conversation&.messages&.create!(body: params[:body], user: current_user)
    @conversation
      .messages
      .create!(body: params[:body], user: current_user)
    @conversation.
      messages.
      create!(body: params[:body], user: current_user)
    ChatMessage
      .create!(room: @room, user: current_user, content: params[:message][:content])
    ChatMessage&.create!(room: @room, user: current_user, content: params[:message][:content])
    head :created
  end
end
