# lexcode-expect: 4
import anthropic
import ollama
from fastapi import FastAPI
from openai import OpenAI

app = FastAPI()
client = OpenAI()
claude = anthropic.Anthropic()


def summarize(text: str) -> str:
    # A service function hands the model's text to its caller. Where that text goes
    # is not visible here, so the match is a signal.
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"Summarize:\n{text}"}],
    )
    return completion.choices[0].message.content


def draft_reply(email: str):
    msg = claude.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=600,
        messages=[{"role": "user", "content": f"Draft a polite reply to:\n{email}"}],
    )
    return {"email": email, "reply": msg.content[0].text}


def stream_story(topic: str):
    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"Tell a story about {topic}"}],
        stream=True,
    )
    for chunk in stream:
        yield chunk.choices[0].delta.content or ""


def describe(name: str):
    out = ollama.generate(model="llama3.2", prompt=f"Describe {name} in two sentences.")
    return out["response"].strip()


@app.post("/tagline")
def tagline(body: dict):
    # This route answers the request itself, so the evidence rule owns it and the
    # signal rule stays quiet.
    r = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Write a tagline for " + body["topic"]}],
    )
    return {"tagline": r.choices[0].message.content}
