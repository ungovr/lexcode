# lexcode-expect: 0
# Text pipelines, text-to-speech and a recognizer-like class that never hears audio.
import pyttsx3
from transformers import pipeline

classifier = pipeline("text-classification", model="distilbert-base-uncased-finetuned-sst-2-english")
summarizer = pipeline("summarization", model="facebook/bart-large-cnn")


def tone_of(text):
    return classifier(text)[0]["label"]


def short_version(text):
    return summarizer(text, max_length=60)[0]["summary_text"]


def say(text):
    engine = pyttsx3.init()
    engine.say(text)
    engine.runAndWait()


class PatternRecognizer:
    def recognize_name(self, text):
        # Finds a capitalized word in typed text.
        return [word for word in text.split() if word[:1].isupper()]


def names_in(text):
    return PatternRecognizer().recognize_name(text)
