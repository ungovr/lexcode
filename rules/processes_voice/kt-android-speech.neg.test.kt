// lexcode-expect: 0
// Android code that speaks or opens other intents and never listens: text-to-speech reading
// typed text aloud, a camera intent, and a web-search intent that imports RecognizerIntent
// for a constant that is not speech recognition. A location tracker has a startListening
// method of its own and is called on a receiver.
package demo.android

import android.app.Activity
import android.content.Intent
import android.os.Bundle
import android.provider.MediaStore
import android.speech.RecognizerIntent
import android.speech.tts.TextToSpeech
import java.util.Locale

class ReaderActivity : Activity(), TextToSpeech.OnInitListener {
    private lateinit var tts: TextToSpeech
    private val tracker = LocationTracker()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        tts = TextToSpeech(this, this)
        tracker.startListening(this)
    }

    override fun onInit(status: Int) {
        tts.language = Locale.US
        tts.speak("Chapter one", TextToSpeech.QUEUE_FLUSH, null, "chapter")
    }

    fun takePhoto() {
        startActivity(Intent(MediaStore.ACTION_IMAGE_CAPTURE))
    }

    fun search() {
        startActivity(Intent(RecognizerIntent.ACTION_WEB_SEARCH))
    }
}

class LocationTracker {
    fun startListening(activity: Activity) {
        println(activity.localClassName)
    }
}
