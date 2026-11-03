# lexcode-expect: 6
import litellm
from anthropic import Anthropic
from fastapi import FastAPI, Request
from flask import Flask, jsonify, request
from openai import AsyncOpenAI, OpenAI
from pydantic import BaseModel

app = FastAPI()
flask_app = Flask(__name__)
client = OpenAI()
aclient = AsyncOpenAI()
claude = Anthropic()


class ChatRequest(BaseModel):
    messages: list[dict]


@app.post("/chat")
async def chat(req: ChatRequest):
    # The client sends the conversation so far on every turn.
    completion = await aclient.chat.completions.create(model="gpt-4o-mini", messages=req.messages)
    return {"reply": completion.choices[0].message.content}


@app.post("/chat-system")
async def chat_with_system(req: ChatRequest):
    system = {"role": "system", "content": "You are the help desk assistant."}
    completion = await aclient.chat.completions.create(model="gpt-4o-mini", messages=[system] + req.messages)
    return {"reply": completion.choices[0].message.content}


@flask_app.route("/api/chat", methods=["POST"])
def flask_chat():
    msg = claude.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=request.get_json()["messages"],
    )
    return jsonify({"reply": msg.content[0].text})


@flask_app.route("/api/chat2", methods=["POST"])
def flask_chat_two():
    data = request.get_json()
    reply = litellm.completion(model="gpt-4o-mini", messages=data["messages"])
    return jsonify({"reply": reply.choices[0].message.content})


@app.post("/raw")
async def raw(request: Request):
    payload = await request.json()
    completion = await aclient.chat.completions.create(model="gpt-4o-mini", messages=payload.get("history", []))
    return {"reply": completion.choices[0].message.content}


@app.post("/stream")
def stream(body: dict):
    with claude.messages.stream(model="claude-sonnet-4-5", max_tokens=1024, messages=body["messages"]) as s:
        return {"reply": s.get_final_text()}
