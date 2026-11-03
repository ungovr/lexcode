# lexcode-expect: 5
import base64
import io

from PIL import Image
from fastapi import FastAPI
from fastapi.responses import Response
from flask import Flask, jsonify, request, send_file
from google import genai
from openai import OpenAI

app = FastAPI()
flask_app = Flask(__name__)
client = OpenAI()
gemini = genai.Client()


@app.post("/avatar")
def avatar(body: dict):
    # The generated picture is the route's return value.
    result = client.images.generate(model="gpt-image-1", prompt=f"Avatar of {body['name']}", size="1024x1024")
    return {"image": result.data[0].b64_json}


@flask_app.route("/poster", methods=["POST"])
def poster():
    result = client.images.generate(model="dall-e-3", prompt=request.json["theme"])
    png = base64.b64decode(result.data[0].b64_json)
    return send_file(io.BytesIO(png), mimetype="image/png")


@flask_app.route("/retouch", methods=["POST"])
def retouch():
    edited = client.images.edit(model="gpt-image-1", image=request.files["photo"], prompt=request.form["prompt"])
    return jsonify({"image": edited.data[0].b64_json})


@app.get("/imagen")
def imagen(theme: str):
    response = gemini.models.generate_images(model="imagen-4.0-generate-001", prompt=theme)
    return Response(content=response.generated_images[0].image.image_bytes, media_type="image/png")


@app.get("/watermarked")
def watermarked(prompt: str):
    # The picture is decoded, re-encoded into a buffer and returned.
    result = client.images.generate(model="gpt-image-1", prompt=prompt)
    image = Image.open(io.BytesIO(base64.b64decode(result.data[0].b64_json)))
    buf = io.BytesIO()
    image.save(buf, format="PNG")
    return Response(content=buf.getvalue(), media_type="image/png")
