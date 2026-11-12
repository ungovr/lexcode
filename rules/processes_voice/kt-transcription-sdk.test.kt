// lexcode-expect: 14
// Sending recorded speech to speech-to-text services from Kotlin: Amazon Transcribe (the AWS
// SDK for Kotlin and for Java, batch and streaming), Google Cloud Speech, Azure Speech (the
// recognizer, a conversation transcriber and the recognizer under an import alias, which a
// project does to tell it from android.speech.SpeechRecognizer), the OpenAI Java SDK and the
// aallam Kotlin client, Spring AI, AssemblyAI, Deepgram and IBM Watson. The Google and Azure
// imports are wildcards, as many projects write them.
package demo.voice

import aws.sdk.kotlin.services.transcribe.TranscribeClient
import aws.sdk.kotlin.services.transcribe.model.LanguageCode
import aws.sdk.kotlin.services.transcribestreaming.TranscribeStreamingClient
import com.aallam.openai.api.audio.TranscriptionRequest
import com.assemblyai.api.AssemblyAI
import com.deepgram.DeepgramClient
import com.google.cloud.speech.v1.*
import com.ibm.watson.speech_to_text.v1.SpeechToText
import com.microsoft.cognitiveservices.speech.*
import com.microsoft.cognitiveservices.speech.SpeechRecognizer as AzureRecognizer
import com.microsoft.cognitiveservices.speech.audio.AudioConfig
import com.microsoft.cognitiveservices.speech.transcription.ConversationTranscriber
import com.openai.client.OpenAIClient
import com.openai.models.audio.transcriptions.TranscriptionCreateParams
import org.springframework.ai.audio.transcription.AudioTranscriptionPrompt
import software.amazon.awssdk.services.transcribe.TranscribeClient as JavaTranscribeClient

class SpeechPipeline(
    private val transcribe: TranscribeClient,
    private val javaTranscribe: JavaTranscribeClient,
    private val streaming: TranscribeStreamingClient,
    private val openai: OpenAIClient,
    private val assembly: AssemblyAI,
    private val deepgram: DeepgramClient,
    private val watson: SpeechToText,
) {
    suspend fun batch(bucketUri: String) {
        transcribe.startTranscriptionJob {
            transcriptionJobName = "voicemail-1"
            languageCode = LanguageCode.EnUs
        }
    }

    fun javaBatch(request: Any) {
        javaTranscribe.startTranscriptionJob(request as software.amazon.awssdk.services.transcribe.model.StartTranscriptionJobRequest)
    }

    suspend fun live(request: Any) {
        streaming.startStreamTranscription(request) { response -> println(response) }
    }

    fun google(audio: ByteArray): String {
        SpeechClient.create().use { speech ->
            val config = RecognitionConfig.newBuilder().setLanguageCode("en-US").build()
            val content = RecognitionAudio.newBuilder().build()
            speech.longRunningRecognizeAsync(config, content)
            return speech.recognize(config, content).toString()
        }
    }

    fun azure(key: String, region: String, path: String) {
        val config = SpeechConfig.fromSubscription(key, region)
        val audio = AudioConfig.fromWavFileInput(path)
        val recognizer = SpeechRecognizer(config, audio)
        recognizer.recognizeOnceAsync().get()
        val aliased = AzureRecognizer(config, audio)
        aliased.recognizeOnceAsync().get()
        val meeting = ConversationTranscriber(audio)
        meeting.startTranscribingAsync().get()
    }

    fun whisper(params: TranscriptionCreateParams): String =
        openai.audio().transcriptions().create(params).text()

    suspend fun kotlinClient(file: Any) {
        val request = TranscriptionRequest(model = null, audio = file)
        println(request)
    }

    fun springAi(resource: Any) {
        println(AudioTranscriptionPrompt(resource))
    }

    fun assemblyAi(url: String) {
        assembly.transcripts().transcribe(url)
    }

    fun deepgramFile(path: java.io.File) {
        deepgram.listen().v1().media().transcribeFile(path)
    }

    fun ibm(options: Any) {
        watson.recognize(options)
    }
}
