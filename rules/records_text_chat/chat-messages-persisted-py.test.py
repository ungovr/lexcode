# lexcode-expect: 4
# Python chat endpoints that keep the conversation: the messages in the request
# are written to a database.
from fastapi import FastAPI, Request
from flask import Flask, request as flask_request
from sqlalchemy.orm import Session

from .models import ChatTurn, Conversation
from .schemas import ChatRequest

app = FastAPI()
flask_app = Flask(__name__)


@app.post("/chat")
async def chat(body: ChatRequest, session: Session):
    for message in body.messages:
        session.add(ChatTurn(conversation_id=body.conversation_id, role=message.role, content=message.content))
    session.commit()
    return {"stored": True}


@app.post("/chat/archive")
async def archive(request: Request, db):
    payload = await request.json()
    await db.chats.insert_one({"user": payload["user"], "messages": payload["messages"]})
    return {"stored": True}


@flask_app.post("/chat")
def flask_chat():
    data = flask_request.get_json()
    Conversation.objects.create(user_id=data["user"], transcript=data["messages"])
    return {"stored": True}


@flask_app.post("/chat/log")
def flask_log(session):
    messages = flask_request.json["messages"]
    session.add_all([ChatTurn(role=m["role"], content=m["content"]) for m in messages])
    return {"stored": True}
