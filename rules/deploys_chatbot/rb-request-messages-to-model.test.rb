# lexcode-expect: 25
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
end

class ShapedCalls < ApplicationController
  def paren_less
    openai.chat parameters: { model: "gpt-4o-mini", messages: params[:messages] }
  end

  def multi_line
    openai.messages(
      parameters: { model: "claude-sonnet-4-5", max_tokens: 512, messages: params[:history] }
    )
  end

  def split_chain
    client.messages
      .create(model: "claude-sonnet-4-5", max_tokens: 512, messages: params[:history])
  end
end

# Shapes the anchor must admit: a leading-dot chain, a trailing dot and safe navigation.
class ChainShapesChats < ApplicationController
  def create
    msg = anthropic&.messages&.create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: params[:history])
    msg = anthropic
      .messages
      .create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: params[:history])
    msg = anthropic.
      messages.
      create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: params[:history])
    reply = client
      .chat
      .completions
      .create(model: "gpt-4o-mini", messages: params[:messages])
    render json: { reply: reply, msg: msg }
  end
end

# Shapes the anchor must also admit: an empty () after a no-arg method, a comment line or a
# backslash between the two tokens, and (schema, Mailchimp) text after or far from the key.
class ResidualShapesChats < ApplicationController
  def create
    msg = anthropic.messages().create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: params[:history])
    msg = anthropic.messages # the model call
      .create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: params[:history])
    msg = anthropic.messages \
      .create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: params[:history])
    msg = anthropic.messages parameters: { model: "claude-sonnet-4-5", max_tokens: 1024, messages: params[:history] }
    render json: { msg: msg }
  end
end

# The conversation list itself, after a system message, spread into a list, mapped, or read
# from nested params in the call.
class ListShapesController < ApplicationController
  def create
    system = { role: "system", content: "You are the help desk assistant." }
    openai.chat(parameters: { model: "gpt-4o-mini", messages: [system, *params[:history]] })
    openai.chat(parameters: { model: "gpt-4o-mini", messages: params[:messages].map { |m| { role: m[:role], content: m[:content] } } })
    anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: params.dig(:chat, :messages))
    client.responses.create(model: "gpt-5", input: request.params[:messages])
    openai.chat(parameters: { model: "gpt-4o-mini", messages: params.fetch(:history, []) })
    openai.chat(parameters: { model: "gpt-4o-mini", messages: params.require(:messages) })
  end
end
