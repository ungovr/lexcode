// lexcode-expect: 0
// Image-model calls whose output stays with the team that runs them, and pictures a person made that the app only resizes.
package com.example.negative.image;

import com.google.genai.Client;
import com.openai.client.OpenAIClient;
import com.openai.models.images.ImageGenerateParams;
import com.openai.models.images.ImagesResponse;
import dev.langchain4j.model.image.ImageModel;
import jakarta.servlet.http.HttpServletResponse;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import javax.imageio.ImageIO;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

public class MoodBoardJob {
  private static final Logger log = LoggerFactory.getLogger(MoodBoardJob.class);

  // bin/moodboard: a designer runs it and opens the files it writes.
  public static void main(String[] args) throws Exception {
    OpenAIClient client = com.openai.client.okhttp.OpenAIOkHttpClient.fromEnv();
    ImagesResponse images = client.images().generate(
        ImageGenerateParams.builder().model("gpt-image-1").prompt("A calm harbor at dawn").build());
    byte[] png = Base64.getDecoder().decode(images.data().get().get(0).b64Json().get());
    Files.write(Path.of("harbor.png"), png);
    log.info("wrote harbor.png, {} bytes", png.length);

    Client genai = Client.builder().apiKey(System.getenv("GOOGLE_API_KEY")).build();
    var generated = genai.models.generateImages("imagen-3.0-generate-002", "A calm harbor at dawn", null);
    System.out.println(generated.generatedImages().get().size());
  }

  public void draft(ImageModel model, String prompt) throws IOException {
    var image = model.generate(prompt).content();
    Files.write(Path.of("draft.png"), Base64.getDecoder().decode(image.base64Data()));
  }

  // A picture a person uploaded, resized and sent back. No model drew it.
  @RestController
  public static class AvatarController {
    @GetMapping("/avatar")
    public void avatar(@RequestParam String name, HttpServletResponse resp) throws IOException {
      BufferedImage original = ImageIO.read(Path.of("avatars", name + ".png").toFile());
      BufferedImage small = new BufferedImage(64, 64, BufferedImage.TYPE_INT_ARGB);
      small.getGraphics().drawImage(original, 0, 0, 64, 64, null);
      resp.setContentType("image/png");
      ImageIO.write(small, "png", resp.getOutputStream());
    }

    @GetMapping("/upload-preview")
    public ResponseEntity<byte[]> preview(@RequestParam MultipartFile file) throws IOException {
      byte[] bytes = file.getBytes();
      return ResponseEntity.ok(bytes);
    }
  }
}

// An in-house photo service whose method names sound like image-model calls. The photos are
// the ones people uploaded; nothing here calls a model.
@RestController
class PhotoController {
  private final PhotoService photos;

  PhotoController(PhotoService photos) {
    this.photos = photos;
  }

  @GetMapping("/photos/edit")
  public byte[] edit(@RequestParam String upload) {
    return photos.editImage(upload);
  }

  @GetMapping("/photos/upscale")
  public ResponseEntity<byte[]> upscale(@RequestParam String upload) {
    byte[] larger = photos.upscaleImage(upload, 2);
    return ResponseEntity.ok(larger);
  }

  @GetMapping("/photos/album")
  public Object album(@RequestParam String album) {
    var images = photos.generateImages(album);
    return images;
  }
}
