# lexcode-expect: 0
# Model calls with no conversation: single-shot summarization, a batch job, a call whose messages
# are built once and never kept, and a static FAQ.
class TicketLabelsController < ApplicationController
  def create
    # The messages list is built in the action from a single field and never kept.
    messages = [{ role: "user", content: "Label this ticket: #{params[:ticket]}" }]
    messages << { role: "user", content: "Answer with one word." }
    msg = anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 20, messages: messages)
    render json: { label: msg.content.first.text }
  end
end

class LabelAll
  def call(docs)
    # A batch job: each document gets its own call, and no reply is fed back.
    docs.map do |doc|
      messages = []
      messages << { role: "user", content: "One word label for: #{doc}" }
      r = openai.chat(parameters: { model: "gpt-4o-mini", messages: messages })
      r.dig("choices", 0, "message", "content")
    end
  end
end

class Translator
  def call(text)
    # A prompt built in steps and sent once: a system line plus a user line, nothing pushed after.
    messages = []
    messages << { role: "system", content: "Translate to French." }
    messages << { role: "user", content: text }
    client.chat(parameters: { model: "gpt-4o", messages: messages })
  end

  def few_shot(text)
    # Few-shot examples pushed in a loop, then the text; one call, no reply fed back.
    messages = [{ role: "system", content: "Label the sentiment." }]
    EXAMPLES.each do |example, label|
      messages << { role: "user", content: example }
      messages << { role: "assistant", content: label }
    end
    messages << { role: "user", content: text }
    openai.chat(parameters: { model: "gpt-4o-mini", messages: messages })
  end

  def few_shot_push(text)
    messages = [{ role: "system", content: "Label the sentiment." }]
    messages.push({ role: "user", content: "great" })
    messages.push({ role: "assistant", content: "positive" })
    messages.push({ role: "user", content: text })
    anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 10, messages: messages)
  end
end

class Captions
  def caption(photo_url)
    # A one-off call to a Google model, not a chat session.
    gemini.generate_content({ contents: { role: "user", parts: [{ text: "Caption this photo." }, { text: photo_url }] } })
  end
end

class Transcript
  def render_lines(turns)
    # Turns pushed for display, never sent to a model.
    lines = []
    turns.each { |t| lines << { role: "user", content: t } }
    lines << { role: "assistant", content: "done" }
    lines
  end
end

class FaqsController < ApplicationController
  def show
    render html: "<dl><dt>How do I reset my password?</dt><dd>Use the link on the sign-in page.</dd></dl>".html_safe
  end
end
