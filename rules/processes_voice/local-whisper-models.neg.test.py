# lexcode-expect: 0
# A model object that shares the method name, and speech tools that never hear a
# person: loading audio for playback, resampling, and synthesis.
import wave

import numpy as np
from transformers import MarianMTModel, MarianTokenizer

tokenizer = MarianTokenizer.from_pretrained("Helsinki-NLP/opus-mt-en-fr")
translator = MarianMTModel.from_pretrained("Helsinki-NLP/opus-mt-en-fr")


def translate(text):
    tokens = tokenizer(text, return_tensors="pt")
    return tokenizer.decode(translator.generate(**tokens)[0], skip_special_tokens=True)


class Ledger:
    def transcribe(self, rows):
        # Copies rows into a new ledger. The name is the only thing it shares with speech.
        return [dict(row) for row in rows]


def copy_ledger(rows):
    return Ledger().transcribe(rows)


def duration_seconds(path):
    with wave.open(path, "rb") as handle:
        return handle.getnframes() / handle.getframerate()


def sine_tone(seconds, rate=16000):
    t = np.linspace(0, seconds, int(rate * seconds), endpoint=False)
    return np.sin(2 * np.pi * 440 * t)
