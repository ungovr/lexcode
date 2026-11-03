# lexcode-expect: 8
import anthropic
import litellm
import ollama
from fastapi import APIRouter, FastAPI
from fastapi.responses import JSONResponse, StreamingResponse
from flask import Flask, jsonify, request
from openai import AsyncOpenAI, OpenAI

app = FastAPI()
router = APIRouter()
flask_app = Flask(__name__)
client = OpenAI()
aclient = AsyncOpenAI()
claude = anthropic.Anthropic()


@app.post("/summarize")
async def summarize(body: dict):
    # The model's summary is the route's return value, so it is the response body.
    completion = await aclient.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Summarize: " + body["text"]}],
    )
    return {"summary": completion.choices[0].message.content}


@router.get("/headline")
def headline(topic: str):
    # A model served locally by Ollama counts the same as a vendor's.
    out = ollama.chat(model="llama3.2", messages=[{"role": "user", "content": f"Write a headline about {topic}"}])
    return out["message"]["content"]


@flask_app.route("/rewrite", methods=["POST"])
def rewrite():
    msg = claude.messages.create(
        model="claude-sonnet-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": "Rewrite plainly: " + request.json["text"]}],
    )
    return jsonify({"text": msg.content[0].text})


@app.post("/draft")
def draft(body: dict):
    reply = litellm.completion(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Draft a reply to: " + body["email"]}],
    )
    return JSONResponse({"draft": reply.choices[0].message.content})


def build_reply(prompt):
    # Not a route function: the model text only reaches a user through the response class.
    r = client.chat.completions.create(model="gpt-4o-mini", messages=[{"role": "user", "content": prompt}])
    text = r.choices[0].message.content
    return JSONResponse(content={"text": text})


@app.get("/stream")
def stream(topic: str):
    stream = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": f"Tell a story about {topic}"}],
        stream=True,
    )
    pieces = (chunk.choices[0].delta.content or "" for chunk in stream)
    return StreamingResponse(pieces, media_type="text/plain")


@flask_app.get("/legacy")
def legacy():
    import openai

    r = openai.ChatCompletion.create(model="gpt-3.5-turbo", messages=[{"role": "user", "content": "Hi"}])
    return jsonify(reply=r["choices"][0]["message"]["content"])


@flask_app.get("/parsed")
async def parsed():
    r = await aclient.beta.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": "Give me a title."}],
        response_format=dict,
    )
    return {"title": r.choices[0].message.content}
