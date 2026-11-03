# lexcode-expect: 0
# Speech synthesis that only the team hears, and audio handling that synthesizes nothing.
from fastapi import FastAPI
from fastapi.responses import FileResponse
from openai import OpenAI

app = FastAPI()
client = OpenAI()


def main():
    # bin/make_voicemail_greeting.py: an operator runs it and plays the file.
    speech = client.audio.speech.create(
        model="gpt-4o-mini-tts",
        voice="alloy",
        input="You have reached the front desk. Please leave a message.",
    )
    speech.write_to_file("scripts/out/greeting.mp3")
    print("greeting written")


def render_all_prompts(prompts):
    # A batch that renders review copies into a local folder.
    for i, prompt in enumerate(prompts):
        with client.audio.speech.with_streaming_response.create(model="tts-1", voice="nova", input=prompt) as resp:
            resp.stream_to_file(f"scripts/out/review-{i}.mp3")


@app.get("/recordings/{rec_id}")
def recording(rec_id: str):
    # A person's own recording that the app only plays is not generated audio.
    return FileResponse(f"recordings/{rec_id}.mp3", media_type="audio/mpeg")


@app.post("/transcribe")
def transcribe(body: dict):
    # Transcribing a person's recording turns speech into text; it makes no audio.
    with open(body["path"], "rb") as audio_file:
        transcript = client.audio.transcriptions.create(model="gpt-4o-transcribe", file=audio_file)
    return {"text": transcript.text}


if __name__ == "__main__":
    main()
