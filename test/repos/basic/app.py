"""A small voice-notes service: turns an uploaded recording into text."""
import whisper

model = whisper.load_model("base")


def notes_from_recording(path):
    result = model.transcribe(path)
    return result["text"]
