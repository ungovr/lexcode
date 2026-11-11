# lexcode-expect: 11
# Rails endpoints and an ActionCable channel that hand what a person typed, or the conversation so
# far, to a language model.
class ChatsController < ApplicationController
  def create
    # The client sends the conversation so far on every turn.
    response = openai.chat(parameters: { model: "gpt-4o-mini", messages: params[:messages] })
    render json: { reply: response.dig("choices", 0, "message", "content") }
  end

  def with_system
    system = { role: "system", content: "You are the help desk assistant." }
    response = openai.chat(parameters: { model: "gpt-4o-mini", messages: [system] + params[:messages] })
    render json: { reply: response.dig("choices", 0, "message", "content") }
  end

  def claude
    msg = anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: params[:history])
    render json: { reply: msg.content.first.text }
  end

  def nested
    history = params.dig(:chat, :messages)
    reply = client.chat.completions.create(model: "gpt-4o-mini", messages: history)
    render json: { reply: reply.choices.first.message.content }
  end

  def one_turn
    # One message from the person, sent as the user turn of a chat call.
    reply = openai.chat(parameters: {
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You answer questions about the library." }, { role: "user", content: params[:message] }]
    })
    render json: { reply: reply.dig("choices", 0, "message", "content") }
  end

  def question
    msg = anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 512, messages: [{ role: "user", content: params[:question] }])
    render json: { reply: msg.content.first.text }
  end

  def ask_bedrock
    body = params[:chat][:messages]
    bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: body)
  end

  def ollama
    ollama_client.chat({ model: "llama3.2", messages: params[:conversation] })
  end

  def strong_params
    openai.chat(parameters: { model: "gpt-4o-mini", messages: chat_params[:messages] })
  end
end

class SupportChannel < ApplicationCable::Channel
  def receive(data)
    reply = openai.chat(parameters: { model: "gpt-4o-mini", messages: data["messages"] })
    transmit(reply: reply.dig("choices", 0, "message", "content"))
  end

  def speak(data)
    reply = client.messages.create(model: "claude-sonnet-4-5", max_tokens: 512, messages: [{ role: "user", content: data["message"] }])
    transmit(reply: reply.content.first.text)
  end
end
