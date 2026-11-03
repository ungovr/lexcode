# lexcode-expect: 5
import boto3
from elevenlabs.client import ElevenLabs
from fastapi import FastAPI
from fastapi.responses import Response, StreamingResponse
from flask import Flask, request, send_file
from google.cloud import texttospeech
from openai import OpenAI

app = FastAPI()
flask_app = Flask(__name__)
client = OpenAI()
eleven = ElevenLabs()
gcloud = texttospeech.TextToSpeechClient()
polly = boto3.client("polly")


@app.post("/narrate")
def narrate(body: dict):
    # The narration the model speaks is the response body.
    speech = client.audio.speech.create(model="gpt-4o-mini-tts", voice="alloy", input=body["text"])
    return Response(content=speech.content, media_type="audio/mpeg")


@app.get("/stream")
def stream(text: str):
    with client.audio.speech.with_streaming_response.create(model="tts-1", voice="nova", input=text) as speech:
        chunks = speech.iter_bytes()
    return StreamingResponse(chunks, media_type="audio/mpeg")


@app.post("/eleven")
def eleven_route(body: dict):
    audio = eleven.text_to_speech.convert(voice_id="JBFqnCBsd6RMkjVDRZzb", text=body["text"], model_id="eleven_multilingual_v2")
    return StreamingResponse(audio, media_type="audio/mpeg")


@flask_app.route("/read-aloud", methods=["POST"])
def read_aloud():
    response = gcloud.synthesize_speech(
        input=texttospeech.SynthesisInput(text=request.json["text"]),
        voice=texttospeech.VoiceSelectionParams(language_code="en-US", name="en-US-Neural2-C"),
        audio_config=texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3),
    )
    return Response(response.audio_content, mimetype="audio/mpeg")


@app.post("/polly")
def polly_route(body: dict):
    out = polly.synthesize_speech(Text=body["text"], OutputFormat="mp3", VoiceId="Joanna", Engine="neural")
    return Response(content=out["AudioStream"].read(), media_type="audio/mpeg")
