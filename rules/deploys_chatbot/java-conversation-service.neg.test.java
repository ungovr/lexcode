// lexcode-expect: 0
package demo.bots;

import com.amazonaws.services.textract.AmazonTextract;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import net.sourceforge.tess4j.Tesseract;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

// Text recognition that is not a conversation, a session client that is not a bot, and a static FAQ.
@RestController
public class NotABot {
    private final Tesseract tesseract;
    private final ImageAnnotatorClient vision;
    private final SessionRegistry sessionRegistry;
    private final FaqPage faq;

    public NotABot(Tesseract tesseract, ImageAnnotatorClient vision, SessionRegistry sessionRegistry, FaqPage faq) {
        this.tesseract = tesseract;
        this.vision = vision;
        this.sessionRegistry = sessionRegistry;
        this.faq = faq;
    }

    // OCR reads text out of an image; recognizeText here has nothing to do with a dialogue.
    public String scan(java.io.File image) throws Exception {
        return tesseract.recognizeText(image);
    }

    public Object annotate(com.google.cloud.vision.v1.BatchAnnotateImagesRequest request) {
        return vision.batchAnnotateImages(request);
    }

    // An intent lookup on the app's own registry is not a call to a dialogue service.
    public Object lookup(String id) {
        return sessionRegistry.detectIntent(id);
    }

    // A static FAQ page: no back-and-forth exchange.
    @GetMapping("/faq")
    public String faq() {
        return faq.render();
    }
}

class OrderHandler {
    void onMessage(String text) {
        // A class named like a handler, with no bot framework behind it.
    }
}
