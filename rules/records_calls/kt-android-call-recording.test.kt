// lexcode-expect: 5
// Recording a phone call through Android's call audio sources: both sides, the far side and
// this side on a MediaRecorder, the call source on an AudioRecord, and through its builder.
package demo.calls

import android.media.AudioFormat
import android.media.AudioRecord
import android.media.MediaRecorder

class CallRecorder {
    fun bothSides(path: String): MediaRecorder =
        MediaRecorder().apply {
            setAudioSource(MediaRecorder.AudioSource.VOICE_CALL)
            setOutputFile(path)
            prepare()
        }

    fun farSide(recorder: MediaRecorder) {
        recorder.setAudioSource(MediaRecorder.AudioSource.VOICE_DOWNLINK)
    }

    fun thisSide(recorder: MediaRecorder) {
        recorder.setAudioSource(MediaRecorder.AudioSource.VOICE_UPLINK)
    }

    fun raw(): AudioRecord =
        AudioRecord(MediaRecorder.AudioSource.VOICE_CALL, 8000, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT, 4096)

    fun built(format: AudioFormat): AudioRecord =
        AudioRecord.Builder()
            .setAudioSource(MediaRecorder.AudioSource.VOICE_DOWNLINK)
            .setAudioFormat(format)
            .build()
}
