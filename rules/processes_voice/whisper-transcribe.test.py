# lexcode-expect: 2
import whisper
from openai import OpenAI

model = whisper.load_model("base")


def transcribe_local(path):
    # A local Whisper model turns a recording into text.
    result = model.transcribe(path)
    return result["text"]


def transcribe_hosted(path):
    # The hosted speech-to-text endpoint does the same thing over the network.
    client = OpenAI()
    with open(path, "rb") as audio_file:
        reply = client.audio.transcriptions.create(model="whisper-1", file=audio_file)
    return reply.text
