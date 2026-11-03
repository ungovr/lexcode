# lexcode-expect: 4
from fastapi import FastAPI
from flask import Flask, jsonify, request
from google import genai
from openai import OpenAI
from runwayml import RunwayML

app = FastAPI()
flask_app = Flask(__name__)
client = OpenAI()
gemini = genai.Client()
runway = RunwayML()


@app.post("/clip")
def clip(body: dict):
    # The Sora job started for the visitor is returned to them.
    job = client.videos.create(model="sora-2", prompt=body["prompt"], seconds="4")
    return {"job_id": job.id, "status": job.status}


@flask_app.route("/veo", methods=["POST"])
def veo():
    operation = gemini.models.generate_videos(model="veo-3.0-generate-001", prompt=request.json["prompt"])
    return jsonify({"operation": operation.name})


@app.post("/animate")
async def animate(body: dict):
    task = runway.image_to_video.create(
        model="gen4_turbo",
        prompt_image=body["image_url"],
        prompt_text=body["prompt"],
        ratio="1280:720",
    )
    return {"task_id": task.id}


@app.post("/poll")
def poll(body: dict):
    job = client.videos.create_and_poll(model="sora-2", prompt=body["prompt"])
    return {"id": job.id, "status": job.status}
