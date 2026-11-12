// lexcode-expect: 0
// A file that imports the Azure speech package and Amazon Connect, and uses only speech
// recognition-free calls: text-to-speech and an outbound contact. No speaker is enrolled or
// identified.
package demo.voice

import aws.sdk.kotlin.services.connect.ConnectClient
import com.microsoft.cognitiveservices.speech.SpeechConfig
import com.microsoft.cognitiveservices.speech.SpeechSynthesizer

class Greeting(private val connect: ConnectClient) {
    suspend fun callBack(instance: String) =
        connect.startOutboundVoiceContact {
            instanceId = instance
        }

    fun speak(config: SpeechConfig) {
        SpeechSynthesizer(config).SpeakText("Thank you for calling")
    }
}
