// lexcode-expect: 0
// Speech synthesis and text-only calls that sit beside speech recognition and are not it:
// Polly, Azure and Google reading typed text aloud, and a minutes archive whose methods are
// named like the vendors' (startTranscriptionJob, recognize, transcripts().transcribe and so
// on). The file imports no speech-to-text package; the vendor types are written in full, and
// the archive is called on a receiver, the shape of a vendor client's call.
package demo.voice

import com.example.minutes.SpeechRecognizer as MinutesRecognizer

class Narrator {
    private val polly = software.amazon.awssdk.services.polly.PollyClient.create()

    // Typed text goes in; synthetic audio comes out. No person's voice is an input.
    fun readAloud(text: String): ByteArray {
        val request = software.amazon.awssdk.services.polly.model.SynthesizeSpeechRequest.builder()
            .text(text)
            .voiceId("Joanna")
            .outputFormat("mp3")
            .build()
        return polly.synthesizeSpeech(request).readAllBytes()
    }

    fun azureSpeak(key: String, region: String, text: String) {
        val config = com.microsoft.cognitiveservices.speech.SpeechConfig.fromSubscription(key, region)
        val synthesizer = com.microsoft.cognitiveservices.speech.SpeechSynthesizer(config)
        synthesizer.SpeakText(text)
    }

    fun googleSpeak(text: String) {
        com.google.cloud.texttospeech.v1.TextToSpeechClient.create().use { client ->
            val input = com.google.cloud.texttospeech.v1.SynthesisInput.newBuilder().setText(text).build()
            client.synthesizeSpeech(input, null, null)
        }
    }
}

// A local archive with transcription-sounding names and no speech vendor behind them.
class MinutesIndex(private val archive: Archive, private val gateway: Gateway) {
    fun rebuild(name: String) {
        archive.startTranscriptionJob(name)
        archive.startMedicalTranscriptionJob(name)
        archive.startCallAnalyticsJob(name)
        archive.startStreamTranscription(name)
        archive.recognize(name, "en")
        archive.longRunningRecognizeAsync(name)
        archive.batchRecognizeAsync(name)
        archive.streamingRecognizeCallable()
        archive.recognizeUsingWebSocket(name)
        archive.createJob(name)
        archive.transcribe(name)
        archive.startTranscriptionJob { name }
    }

    fun publish(name: String) {
        gateway.transcripts().transcribe(name)
        gateway.transcripts().submit(name)
        gateway.listen().v1().media().transcribeFile(name)
        gateway.listen().v1().media().transcribeUrl(name)
        gateway.audio().transcriptions().create(name)
        gateway.audio().translations().create(name)
    }

    fun keyword(): Boolean {
        val recognizer = SpeechRecognizer("minutes")
        val conversation = ConversationTranscriber("minutes")
        val meeting = MeetingTranscriber("minutes")
        val translation = TranslationRecognizer("minutes")
        val aliased = MinutesRecognizer("minutes")
        val prompt = AudioTranscriptionPrompt("minutes")
        val request = TranscriptionRequest("minutes")
        return recognizer.listen() && conversation != meeting && translation != aliased && prompt != request
    }
}

// Local classes named like the Azure recognizers, with no speech SDK behind them.
class SpeechRecognizer(private val keyword: String) {
    fun listen(): Boolean = keyword.isNotEmpty()
}

class ConversationTranscriber(val title: String)

class MeetingTranscriber(val title: String)

class TranslationRecognizer(val title: String)

class AudioTranscriptionPrompt(val title: String)

class TranscriptionRequest(val title: String)

interface Archive {
    fun startTranscriptionJob(name: String)

    fun startTranscriptionJob(block: () -> String)

    fun startMedicalTranscriptionJob(name: String)

    fun startCallAnalyticsJob(name: String)

    fun startStreamTranscription(name: String)

    fun recognize(name: String, language: String)

    fun longRunningRecognizeAsync(name: String)

    fun batchRecognizeAsync(name: String)

    fun streamingRecognizeCallable()

    fun recognizeUsingWebSocket(name: String)

    fun createJob(name: String)

    fun transcribe(name: String)
}

interface Gateway {
    fun transcripts(): Transcripts

    fun listen(): Listen

    fun audio(): Audio
}

interface Transcripts {
    fun transcribe(name: String)

    fun submit(name: String)
}

interface Listen {
    fun v1(): Listen

    fun media(): Listen

    fun transcribeFile(name: String)

    fun transcribeUrl(name: String)
}

interface Audio {
    fun transcriptions(): Audio

    fun translations(): Audio

    fun create(name: String)
}
