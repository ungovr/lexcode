import whisper


def transcribe(path):
    model = whisper.load_model("base")
    return model.transcribe(path)
