# lexcode-expect: 3
from fastapi import FastAPI
from google import genai
from langchain_openai import ChatOpenAI

app = FastAPI()
llm = ChatOpenAI(model="gpt-4o-mini")
client = genai.Client()


def explain(term: str) -> str:
    # Service functions hand the model's output to their caller. Where it goes is
    # not visible here, so the match is a signal.
    out = llm.invoke(f"Explain {term} simply.")
    return out.content


def summarize_thread(thread: str):
    response = client.models.generate_content(model="gemini-2.5-flash", contents=thread)
    return response.text


def classify_all(notes):
    for note in notes:
        reply = llm.invoke(f"One word label for: {note}")
        yield {"note": note, "label": str(reply.content).strip()}


@app.post("/ask")
def ask(body: dict):
    # This route answers the request itself, so the evidence rule owns it.
    out = llm.invoke(body["question"])
    return {"answer": out.content}
