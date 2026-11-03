# lexcode-expect: 3
import google.generativeai as legacy
from fastapi import FastAPI
from google import genai

app = FastAPI()
client = genai.Client()
SESSIONS = {}


@app.post("/chat/{session_id}")
def chat(session_id: str, body: dict):
    # A chat session object keeps the turns, so a later message is answered in context.
    session = SESSIONS.get(session_id)
    if session is None:
        session = client.chats.create(model="gemini-2.5-flash")
        SESSIONS[session_id] = session
    response = session.send_message(body["text"])
    return {"reply": response.text}


@app.post("/chat-legacy")
def chat_legacy(body: dict):
    model = legacy.GenerativeModel("gemini-1.5-flash")
    session = model.start_chat(history=body.get("history", []))
    result = session.send_message(body["text"])
    return {"reply": result.text}


def stream_turn(text: str) -> str:
    session = client.chats.create(model="gemini-2.5-flash")
    return "".join(chunk.text for chunk in session.send_message_stream(text))
