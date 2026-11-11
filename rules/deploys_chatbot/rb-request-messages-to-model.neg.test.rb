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
