// lexcode-expect: 0
package demo.bots

import com.google.cloud.vision.v1.ImageAnnotatorClient
import net.sourceforge.tess4j.Tesseract
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

// Text recognition that is not a conversation, a session client that is not a bot, and a static FAQ.
@RestController
class NotABot(
    private val tesseract: Tesseract,
    private val vision: ImageAnnotatorClient,
    private val sessionRegistry: SessionRegistry,
    private val faq: FaqPage,
) {
    // OCR reads text out of an image; recognizeText here has nothing to do with a dialogue.
    fun scan(image: java.io.File): String = tesseract.recognizeText(image)

    fun annotate(request: com.google.cloud.vision.v1.BatchAnnotateImagesRequest) = vision.batchAnnotateImages(request)

    // An intent lookup on the app's own registry is not a call to a dialogue service.
    fun lookup(id: String) = sessionRegistry.detectIntent(id)

    // A static FAQ page: no back-and-forth exchange.
    @GetMapping("/faq")
    fun faq(): String = faq.render()
}

// A class named like a handler, with no bot framework behind it, and a class that extends a base
// whose name only starts like the bot framework's.
class OrderHandler {
    fun onMessage(text: String) {
    }
}

open class ActivityHandlerRegistry

// The app's own base class that happens to be called ActivityHandler; this file does not import the
// Bot Framework, so the name alone is not a bot.
open class ActivityHandler {
    open fun handle() {
    }
}

class LegacyBot : ActivityHandler() {
    override fun handle() {
    }
}

class LegacyBotWithDependency(private val log: Logger) : ActivityHandler() {
    override fun handle() {
        log.info("handled")
    }
}

class ActivityTracker : ActivityHandlerRegistry() {
    fun track() {
    }
}

// A text recognition call on a receiver that is not a Lex client, in the trailing-lambda form.
class Dictation(private val engine: OcrEngine) {
    fun read(bytes: ByteArray): String = engine.recognizeText(bytes)

    fun readDsl(): String = engine.recognizeText { language = "en" }
}
