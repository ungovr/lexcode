# lexcode-expect: 15
# A terminal chat and a session object that keep the conversation between calls: every user turn
# and every model turn goes into one history, and the whole history is sent back each time.
class TerminalChat
  def run
    history = [{ role: "system", content: "You are a helpful assistant." }]
    loop do
      line = gets
      history << { role: "user", content: line }
      reply = openai.chat(parameters: { model: "gpt-4o-mini", messages: history })
      answer = reply.dig("choices", 0, "message")
      puts "bot> #{answer['content']}"
      history << answer
    end
  end
end

class Session
  def initialize
    @turns = []
  end

  def say(text)
    @turns.push({ role: "user", content: text })
    msg = anthropic.messages.create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: @turns)
    out = msg.content.first.text
    @turns.push({ role: "assistant", content: out })
    out
  end
end

class Memory
  SESSIONS = {}

  def turn(session_id, text)
    # Server-side memory keyed by conversation id; the model's message is stored as it came.
    messages = (SESSIONS[session_id] ||= [])
    messages << { "role" => "user", "content" => text }
    r = client.chat.completions.create(model: "gpt-4o-mini", messages: messages)
    messages << r.choices.first.message
    r.choices.first.message.content
  end

  def converse(text)
    @messages << { :role => "user", :content => [{ text: text }] }
    resp = bedrock.converse(model_id: "anthropic.claude-3-haiku", messages: @messages)
    @messages << resp.output.message.to_h
    resp.output.message.content.first.text
  end
end

class OtherMethods
  def stream_turn(text)
    @history << { role: "user", content: text }
    resp = bedrock.converse_stream(model_id: "anthropic.claude-3-haiku", messages: @history)
    @history << resp.output.message.to_h
  end

  def multi_line_turn(text)
    @history << { role: "user", content: text }
    reply = client.messages(
      parameters: { model: "claude-sonnet-4-5", max_tokens: 512, messages: @history }
    )
    @history << { role: "assistant", content: reply.dig("content", 0, "text") }
  end

  def paren_less_turn(text)
    @history << { role: "user", content: text }
    reply = openai.chat parameters: { model: "gpt-4o-mini", messages: @history }
    @history << reply.dig("choices", 0, "message")
  end
end

# Shapes the anchor must admit: a leading-dot chain, a trailing dot and safe navigation.
class ChainShapesSession
  def initialize
    @turns = []
  end

  def say(text)
    @turns.push({ role: "user", content: text })
    msg = anthropic&.messages&.create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: @turns)
    @turns.push({ role: "assistant", content: msg.content.first.text })
    msg = anthropic
      .messages
      .create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: @turns)
    @turns.push({ role: "assistant", content: msg.content.first.text })
    msg = anthropic.
      messages.
      create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: @turns)
    @turns.push({ role: "assistant", content: msg.content.first.text })
  end
end

# Shapes the anchor must also admit: an empty () after a no-arg method, a comment line or a
# backslash between the two tokens, and (schema, Mailchimp) text after or far from the key.
class ResidualShapesSession
  def initialize
    @turns = []
  end

  def say(text)
    @turns.push({ role: "user", content: text })
    msg = anthropic.messages().create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: @turns)
    @turns.push({ role: "assistant", content: msg.content.first.text })
    msg = anthropic.messages # the model call
      .create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: @turns)
    @turns.push({ role: "assistant", content: msg.content.first.text })
    msg = anthropic.messages \
      .create(model: "claude-sonnet-4-5", max_tokens: 1024, messages: @turns)
    @turns.push({ role: "assistant", content: msg.content.first.text })
    msg = anthropic.messages parameters: { model: "claude-sonnet-4-5", max_tokens: 1024, messages: @turns }
    @turns.push({ role: "assistant", content: msg.content.first.text })
  end
end

# The rule takes any method that is handed the history, so the anchor admits the key alone: a client
# whose method is named generate, ask, run or anything else.
class AnyMethodSession
  def initialize
    @history = []
  end

  def say(text)
    @history << { role: "user", content: text }
    reply = llm.generate(messages: @history)
    @history << { role: "assistant", content: reply.text }
  end
end
