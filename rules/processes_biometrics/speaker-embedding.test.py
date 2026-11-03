# lexcode-expect: 6
# Speaker embeddings, the voiceprint side of biometrics: a model turns a voice into
# a vector that is compared with enrolled speakers.
import torchaudio
from nemo.collections.asr.models import EncDecSpeakerLabelModel
from pyannote.audio import Inference, Model
from resemblyzer import VoiceEncoder, preprocess_wav
from speechbrain.inference.speaker import EncoderClassifier, SpeakerRecognition

pyannote_embedder = Inference("pyannote/embedding", window="whole")


def embed_with_pyannote(path):
    return pyannote_embedder(path)


def load_pyannote_model():
    return Model.from_pretrained("pyannote/embedding", use_auth_token=True)


def same_speaker(path_a, path_b):
    verifier = SpeakerRecognition.from_hparams(source="speechbrain/spkrec-ecapa-voxceleb")
    score, prediction = verifier.verify_files(path_a, path_b)
    return bool(prediction)


def voiceprint_for(path, model_name):
    classifier = EncoderClassifier.from_hparams(source=model_name)
    signal, _rate = torchaudio.load(path)
    return classifier.encode_batch(signal).squeeze()


def embed_with_resemblyzer(path):
    encoder = VoiceEncoder()
    return encoder.embed_utterance(preprocess_wav(path))


def embed_with_titanet():
    return EncDecSpeakerLabelModel.from_pretrained("titanet_large")
