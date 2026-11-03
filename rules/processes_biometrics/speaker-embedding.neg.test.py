# lexcode-expect: 0
# Speech tools that never build a voiceprint: speaker diarization (who spoke when,
# with no one named), language identification, speech recognition, and a segmenter.
import torchaudio
from pyannote.audio import Inference, Pipeline
from speechbrain.inference.classifiers import EncoderClassifier
from speechbrain.inference.ASR import EncoderDecoderASR

diarizer = Pipeline.from_pretrained("pyannote/speaker-diarization-3.1")
segmenter = Inference("pyannote/segmentation-3.0")


def who_spoke_when(path):
    diarization = diarizer(path)
    return [(turn.start, turn.end, label) for turn, _, label in diarization.itertracks(yield_label=True)]


def speech_regions(path):
    return segmenter(path)


def language_of(path):
    classifier = EncoderClassifier.from_hparams(source="speechbrain/lang-id-voxlingua107-ecapa")
    signal, _rate = torchaudio.load(path)
    return classifier.classify_batch(signal)[3]


def transcript_of(path):
    asr = EncoderDecoderASR.from_hparams(source="speechbrain/asr-crdnn-rnnlm-librispeech")
    return asr.transcribe_file(path)


class SentenceIndex:
    def embed_utterance(self, text):
        # Hashes typed text for search. The name is the only thing it shares with a voice model.
        return hash(text)


def index(text):
    return SentenceIndex().embed_utterance(text)
