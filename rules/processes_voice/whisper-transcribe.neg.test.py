# lexcode-expect: 0
from openai import OpenAI


def speak(text):
    # Speech synthesis: text goes in, audio comes out. No human voice is processed.
    client = OpenAI()
    return client.audio.speech.create(model="tts-1", voice="alloy", input=text)


def transcribe(text):
    # Normalizes spacing in a string. The name is the only thing it shares with speech-to-text.
    return " ".join(text.split())


class Notes:
    def transcribe(self, line):
        return line.strip()

    def clean(self, line):
        return self.transcribe(line)


print(transcribe("hello   world"))
print(Notes().transcribe("  a note  "))
