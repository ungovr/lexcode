# lexcode-expect: 0
# Model calls with no conversation: single-shot summarization, a batch job, a route whose request
# carries one text, a call with fixed messages, flash messages, and a static FAQ.
class SummariesController < ApplicationController
  def create
    # The request carries one text; the prompt is a fixed system turn plus that text.
    response = openai.chat(
      parameters: {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "Summarize the text in one paragraph." },
          { role: "user", content: params[:text] }
        ]
      }
    )
    render json: { summary: response.dig("choices", 0, "message", "content") }
  end
end

class TicketLabelsController < ApplicationController
  def create
    # The messages list is built in the action from a single field and never kept.
    messages = [{ role: "user", content: "Label this ticket: #{params[:ticket]}" }]
    msg = anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 20, messages: messages)
    render json: { label: msg.content.first.text }
  end
end

class LabelAllJob < ApplicationJob
  def perform(docs)
    # A batch job: each document gets its own call, and no reply is fed back.
    docs.map do |doc|
      client.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "One word label for: #{doc}" }] })
    end
  end
end

class WarmupsController < ApplicationController
  def show
    # Fixed messages, nothing from the request.
    reply = openai.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Say ok" }] })
    render json: reply
  end
end

class ExplainersController < ApplicationController
  def one_shot
    # One typed question inside a fixed prompt: a one-shot tool, no conversation list.
    openai.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Explain: #{params[:question]}" }] })
  end

  def one_turn
    # One message as the user turn next to a fixed system turn: still no list from the request.
    reply = openai.chat(parameters: {
      model: "gpt-4o-mini",
      messages: [{ role: "system", content: "You answer questions about the library." }, { role: "user", content: params[:message] }]
    })
    render json: { reply: reply.dig("choices", 0, "message", "content") }
  end

  def question
    anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 512, messages: [{ role: "user", content: params[:question] }])
  end
end

class OneShotChannel < ApplicationCable::Channel
  def speak(data)
    reply = client.messages.create(model: "claude-sonnet-4-5", max_tokens: 512, messages: [{ role: "user", content: data["message"] }])
    transmit(reply: reply.content.first.text)
  end
end

class WebhookJob < ApplicationJob
  def perform(data)
    # `data` outside a channel is a generic local name.
    client.messages.create(model: "claude-sonnet-4-5", max_tokens: 100, messages: data["messages"])
  end
end

class FlashController < ApplicationController
  def index
    # `messages` here are flash notices, not a conversation with a model.
    @messages = params[:messages]
    Rails.logger.info(@messages)
  end
end

class FaqsController < ApplicationController
  def show
    # A static FAQ with no back-and-forth exchange.
    render html: "<dl><dt>How do I reset my password?</dt><dd>Use the link on the sign-in page.</dd></dl>".html_safe
  end
end

# A conversation pasted into a single prompt, to summarize or title it, is a one-shot tool: the
# request carries text, not a list of turns for the model to continue.
class ThreadToolsController < ApplicationController
  def summary
    response = openai.chat(parameters: { model: "gpt-4o-mini", messages: [{ role: "user", content: "Summarize: #{params[:conversation]}" }] })
    render json: { summary: response.dig("choices", 0, "message", "content") }
  end

  def title
    msg = anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 64, messages: [{ role: "user", content: params[:history] }])
    render json: { title: msg.content.first.text }
  end

  def digest
    reply = client.responses.create(model: "gpt-5", input: "List the decisions in this thread: #{params[:messages]}")
    render json: { digest: reply.output_text }
  end
end

class ThreadToolsChannel < ApplicationCable::Channel
  def summarize(data)
    reply = client.messages.create(model: "claude-sonnet-4-5", max_tokens: 256, messages: [{ role: "user", content: "Summarize: #{data["conversation"]}" }])
    transmit({ summary: reply.content.first.text })
  end
end

# String keys, in either hash syntax: still one message's content, not a list of turns.
class ThreadTitlesController < ApplicationController
  def create
    openai.chat(parameters: { model: "gpt-4o-mini", messages: [{ "role" => "user", "content" => params[:history] }] })
    openai.chat(parameters: { model: "gpt-4o-mini", messages: [{ "role": "user", "content": params[:history] }] })
  end
end
