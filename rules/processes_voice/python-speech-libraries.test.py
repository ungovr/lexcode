# lexcode-expect: 5
# Python speech recognition libraries: the SpeechRecognition package's recognize_*
# methods, Vosk, and Hugging Face / MLX speech pipelines.
import json

import mlx_whisper
import speech_recognition as sr
from transformers import pipeline
from vosk import KaldiRecognizer, Model


def recognize_microphone():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        audio = recognizer.listen(source, timeout=5)
    return recognizer.recognize_google(audio, language="en-US")


def recognize_file(path):
    recognizer = sr.Recognizer()
    with sr.AudioFile(path) as source:
        audio = recognizer.record(source)
    return recognizer.recognize_sphinx(audio)


def recognize_with_vosk(frames):
    rec = KaldiRecognizer(Model("model-en"), 16000)
    for chunk in frames:
        rec.AcceptWaveform(chunk)
    return json.loads(rec.FinalResult())["text"]


def recognize_with_pipeline(path):
    asr = pipeline("automatic-speech-recognition", model="openai/whisper-small")
    return asr(path)["text"]


def recognize_on_apple_silicon(path):
    return mlx_whisper.transcribe(path, path_or_hf_repo="mlx-community/whisper-tiny")["text"]
