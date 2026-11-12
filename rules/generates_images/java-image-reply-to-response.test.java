// lexcode-expect: 8
package com.example.image;

import com.google.genai.Client;
import com.openai.client.OpenAIClient;
import com.openai.models.images.ImageGenerateParams;
import com.openai.models.images.ImagesResponse;
import dev.langchain4j.model.image.ImageModel;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Base64;
import org.springframework.ai.image.ImagePrompt;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;

@RestController
public class PictureController {
  private final OpenAIClient openai;
  private final Client genai;
  private final ImageModel imageModel;
  private final org.springframework.ai.image.ImageModel springImages;
  private final BedrockRuntimeClient bedrock;

  public PictureController(OpenAIClient openai, Client genai, ImageModel imageModel,
      org.springframework.ai.image.ImageModel springImages, BedrockRuntimeClient bedrock) {
    this.openai = openai;
    this.genai = genai;
    this.imageModel = imageModel;
    this.springImages = springImages;
    this.bedrock = bedrock;
  }

  // The picture the model draws is the response.
  @PostMapping("/avatar")
  public ResponseEntity<byte[]> avatar(@RequestParam String description) {
    ImagesResponse images = openai.images().generate(
        ImageGenerateParams.builder().model("gpt-image-1").prompt(description).build());
    byte[] png = Base64.getDecoder().decode(images.data().get().get(0).b64Json().get());
    return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(png);
  }

  @GetMapping("/logo")
  public String logo(@RequestParam String brand) {
    var images = genai.models.generateImages("imagen-3.0-generate-002", "A logo for " + brand, null);
    return images.generatedImages().get().get(0).image().get().imageBytes().toString();
  }

  @GetMapping("/edit")
  public ResponseEntity<String> edit(@RequestParam String photo) {
    var edited = genai.models.editImage("imagen-3.0-capability-001", "Remove the background", null, null);
    return ResponseEntity.ok(edited.toString());
  }

  // LangChain4j and Spring AI.
  public void viaLangChain(String prompt, HttpServletResponse resp) throws IOException {
    var image = imageModel.generate(prompt).content();
    resp.getOutputStream().write(Base64.getDecoder().decode(image.base64Data()));
  }

  @GetMapping("/spring")
  public String viaSpring(@RequestParam String prompt) {
    var response = springImages.call(new ImagePrompt(prompt));
    return response.getResult().getOutput().getUrl();
  }

  @GetMapping("/bedrock")
  public ResponseEntity<byte[]> viaBedrock(@RequestParam String prompt) {
    var response = bedrock.invokeModel(InvokeModelRequest.builder()
        .modelId("amazon.titan-image-generator-v2:0")
        .body(null)
        .build());
    return ResponseEntity.ok(response.body().asByteArray());
  }

  // A mobile screen shows the picture.
  public static class AvatarActivity extends android.app.Activity {
    private android.widget.ImageView avatarView;
    private OpenAIClient client;

    void load(String description) {
      new Thread(() -> {
        ImagesResponse images = client.images().generate(
            ImageGenerateParams.builder().model("gpt-image-1").prompt(description).build());
        byte[] png = Base64.getDecoder().decode(images.data().get().get(0).b64Json().get());
        android.graphics.Bitmap bitmap = android.graphics.BitmapFactory.decodeByteArray(png, 0, png.length);
        runOnUiThread(() -> avatarView.setImageBitmap(bitmap));
      }).start();
    }
  }

  // An image-to-image variation sent back.
  public void variation(HttpServletResponse resp, java.nio.file.Path source) throws IOException {
    ImagesResponse images = openai.images().createVariation(
        com.openai.models.images.ImageCreateVariationParams.builder().image(source).build());
    resp.getWriter().write(images.data().get().get(0).url().get());
  }
}
