# lexcode-expect: 0
# Vendor clients used for something other than speech: Deepgram's account listing,
# Google Cloud's text-to-speech and translation, and a local Transcriber class.
from deepgram import DeepgramClient
from google.cloud import texttospeech, translate_v2

deepgram = DeepgramClient("key-from-environment")
voice_out = texttospeech.TextToSpeechClient()
translator = translate_v2.Client()


def project_names():
    return [project.name for project in deepgram.manage.v("1").get_projects().projects]


def speak(text):
    synthesis_input = texttospeech.SynthesisInput(text=text)
    voice = texttospeech.VoiceSelectionParams(language_code="en-US")
    config = texttospeech.AudioConfig(audio_encoding=texttospeech.AudioEncoding.MP3)
    return voice_out.synthesize_speech(input=synthesis_input, voice=voice, audio_config=config)


def translate(text, target="es"):
    return translator.translate(text, target_language=target)["translatedText"]


class Transcriber:
    def transcribe(self, rows):
        return [row.strip() for row in rows]


def tidy(rows):
    return Transcriber().transcribe(rows)
