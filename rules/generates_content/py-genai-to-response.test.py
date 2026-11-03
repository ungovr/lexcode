# lexcode-expect: 4
import google.generativeai as legacy
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from flask import Flask, jsonify, request
from google import genai

app = FastAPI()
flask_app = Flask(__name__)
client = genai.Client()


@app.post("/answer")
def answer(body: dict):
    # Whatever the model returns, text or an image, is the route's return value.
    response = client.models.generate_content(model="gemini-2.5-flash", contents=body["question"])
    return {"text": response.text}


@flask_app.route("/describe", methods=["POST"])
def describe():
    model = legacy.GenerativeModel("gemini-1.5-flash")
    result = model.generate_content([request.files["photo"].read(), "Describe this picture."])
    return jsonify({"description": result.text})


@app.post("/async")
async def answer_async(body: dict):
    model = legacy.GenerativeModel("gemini-1.5-flash")
    result = await model.generate_content_async(body["question"])
    return JSONResponse({"text": result.text})


@app.get("/story")
def story(topic: str):
    chunks = client.models.generate_content_stream(model="gemini-2.5-flash", contents=f"Tell a story about {topic}")
    text = "".join(chunk.text for chunk in chunks)
    return {"story": text}
