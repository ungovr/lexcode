# lexcode-expect: 4
# Local speech models other than the reference Whisper package: faster-whisper,
# WhisperX and stable-ts. Each one turns a recording into text on this machine.
import faster_whisper
import stable_whisper
import whisperx
from faster_whisper import WhisperModel

fast_model = WhisperModel("large-v3", device="cuda", compute_type="float16")


def transcribe_meeting(path):
    segments, info = fast_model.transcribe(path, beam_size=5, vad_filter=True)
    return " ".join(segment.text for segment in segments)


def transcribe_with_whisperx(path, device="cuda"):
    model = whisperx.load_model("large-v2", device, compute_type="float16")
    audio = whisperx.load_audio(path)
    return model.transcribe(audio, batch_size=16)


def transcribe_with_stable_ts(path):
    model = stable_whisper.load_faster_whisper("base")
    return model.transcribe(path, regroup=True)


def transcribe_qualified(path):
    model = faster_whisper.WhisperModel("small")
    segments, _ = model.transcribe(path)
    return list(segments)
