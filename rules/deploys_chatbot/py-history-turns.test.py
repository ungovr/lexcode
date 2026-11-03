# lexcode-expect: 3
from anthropic import Anthropic
from openai import OpenAI

client = OpenAI()
claude = Anthropic()


def terminal_chat():
    # A terminal chat: every user turn and every model turn goes into one history,
    # and the whole history is sent back each time.
    history = [{"role": "system", "content": "You are a helpful assistant."}]
    while True:
        line = input("you> ")
        history.append({"role": "user", "content": line})
        reply = client.chat.completions.create(model="gpt-4o-mini", messages=history)
        answer = reply.choices[0].message
        print("bot>", answer.content)
        history.append({"role": "assistant", "content": answer.content})


class Session:
    # A session object that keeps the conversation between calls.
    def __init__(self):
        self.turns = []

    def say(self, text: str) -> str:
        self.turns.append({"role": "user", "content": text})
        msg = claude.messages.create(model="claude-sonnet-4-5", max_tokens=1024, messages=self.turns)
        out = msg.content[0].text
        self.turns.append({"role": "assistant", "content": out})
        return out


SESSIONS: dict[str, list] = {}


def turn(session_id: str, text: str) -> str:
    # Server-side memory keyed by conversation id; the model's message is stored as it came.
    messages = SESSIONS.setdefault(session_id, [])
    messages.append({"role": "user", "content": text})
    r = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
    messages.append(r.choices[0].message)
    return r.choices[0].message.content
