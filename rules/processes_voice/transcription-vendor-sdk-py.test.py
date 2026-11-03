# lexcode-expect: 4
# Deepgram, AssemblyAI and Google Cloud clients: each call sends speech to the vendor.
import assemblyai as aai
from deepgram import DeepgramClient, PrerecordedOptions
from google.cloud import speech

deepgram = DeepgramClient("key-from-environment")
transcriber = aai.Transcriber()
google_client = speech.SpeechClient()


def transcribe_with_deepgram(path):
    with open(path, "rb") as handle:
        payload = {"buffer": handle.read()}
    options = PrerecordedOptions(model="nova-2", smart_format=True)
    response = deepgram.listen.rest.v("1").transcribe_file(payload, options)
    return response.results.channels[0].alternatives[0].transcript


def transcribe_url_with_deepgram(url):
    response = deepgram.listen.prerecorded.v("1").transcribe_url({"url": url}, PrerecordedOptions(model="nova-2"))
    return response.to_json()


def transcribe_with_assemblyai(audio_url):
    transcript = transcriber.transcribe(audio_url, aai.TranscriptionConfig(speaker_labels=True))
    return transcript.text


def transcribe_with_google(content):
    audio = speech.RecognitionAudio(content=content)
    config = speech.RecognitionConfig(language_code="en-US", sample_rate_hertz=16000)
    return google_client.recognize(config=config, audio=audio)
