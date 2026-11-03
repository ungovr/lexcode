# lexcode-expect: 4
from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from flask import Flask, jsonify, request
from langchain.chat_models import init_chat_model
from langchain_anthropic import ChatAnthropic
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

app = FastAPI()
flask_app = Flask(__name__)
llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.2)
claude = ChatAnthropic(model="claude-sonnet-4-5")
prompt = ChatPromptTemplate.from_messages([("system", "Answer in two sentences."), ("human", "{question}")])


@app.post("/ask")
async def ask(body: dict):
    # The chain's answer is the route's return value.
    chain = prompt | llm | StrOutputParser()
    answer = await chain.ainvoke({"question": body["question"]})
    return {"answer": answer}


@flask_app.route("/explain", methods=["POST"])
def explain():
    out = claude.invoke([("human", "Explain simply: " + request.json["term"])])
    return jsonify({"explanation": out.content})


@app.get("/stream")
def stream(topic: str):
    chunks = llm.stream(f"Write a limerick about {topic}")
    pieces = (chunk.content for chunk in chunks)
    return StreamingResponse(pieces, media_type="text/plain")


@flask_app.route("/title", methods=["POST"])
def title():
    chat = init_chat_model("gpt-4o-mini", model_provider="openai")
    reply = chat.invoke("Suggest a title for: " + request.json["text"])
    return jsonify(title=reply.content)
