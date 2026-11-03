# lexcode-expect: 0
# Model calls with no conversation: single-shot summarization, a batch job, a route whose
# request carries one text, and a static FAQ.
import google.generativeai as legacy
from anthropic import Anthropic
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
from openai import OpenAI

app = FastAPI()
client = OpenAI()
claude = Anthropic()


@app.post("/summarize")
def summarize(body: dict):
    # The request carries one text; the prompt is a fixed system turn plus that text.
    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "Summarize the text in one paragraph."},
            {"role": "user", "content": body["text"]},
        ],
    )
    return {"summary": completion.choices[0].message.content}


@app.post("/classify")
def classify(body: dict):
    # The messages list is built in the handler from a single field and never kept.
    messages = [{"role": "user", "content": "Label this ticket: " + body["ticket"]}]
    messages.append({"role": "user", "content": "Answer with one word."})
    msg = claude.messages.create(model="claude-sonnet-4-5", max_tokens=20, messages=messages)
    return {"label": msg.content[0].text}


def label_all(docs):
    # A batch job: each document gets its own call, and no reply is fed back.
    labels = []
    for doc in docs:
        messages = []
        messages.append({"role": "user", "content": f"One word label for: {doc}"})
        r = client.chat.completions.create(model="gpt-4o-mini", messages=messages)
        labels.append(r.choices[0].message.content)
    return labels


def caption(photo_url: str) -> str:
    # A one-off call to a Google model, not a chat session.
    model = legacy.GenerativeModel("gemini-1.5-flash")
    return model.generate_content(["Caption this photo.", photo_url]).text


@app.get("/faq", response_class=HTMLResponse)
def faq():
    # A static FAQ with no back-and-forth exchange.
    return "<dl><dt>How do I reset my password?</dt><dd>Use the link on the sign-in page.</dd></dl>"
