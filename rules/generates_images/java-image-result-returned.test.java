// lexcode-expect: 5
package com.example.image.returned;

import com.google.genai.Client;
import com.openai.client.OpenAIClient;
import com.openai.models.images.ImageGenerateParams;
import com.openai.models.images.ImagesResponse;
import dev.langchain4j.data.image.Image;
import dev.langchain4j.model.image.ImageModel;
import java.util.Base64;
import org.springframework.ai.image.ImagePrompt;
import org.springframework.ai.image.ImageResponse;

public class Painter {
  private final OpenAIClient openai;
  private final Client genai;
  private final ImageModel imageModel;
  private final org.springframework.ai.image.ImageModel springImages;

  public Painter(OpenAIClient openai, Client genai, ImageModel imageModel,
      org.springframework.ai.image.ImageModel springImages) {
    this.openai = openai;
    this.genai = genai;
    this.imageModel = imageModel;
    this.springImages = springImages;
  }

  // A service method hands the picture to its caller. Where it goes is not visible here,
  // so the match is a signal.
  public byte[] avatar(String description) {
    ImagesResponse images = openai.images().generate(
        ImageGenerateParams.builder().model("gpt-image-1").prompt(description).build());
    return Base64.getDecoder().decode(images.data().get().get(0).b64Json().get());
  }

  public Object logo(String brand) {
    var images = genai.models.generateImages("imagen-3.0-generate-002", "A logo for " + brand, null);
    return images.generatedImages().get();
  }

  public Image viaLangChain(String prompt) {
    return imageModel.generate(prompt).content();
  }

  public ImageResponse viaSpring(String prompt) {
    ImageResponse response = springImages.call(new ImagePrompt(prompt));
    return response;
  }

  public String banner(String theme) {
    var upscaled = genai.models.upscaleImage("imagen-3.0-generate-002", null, "x2", null);
    return upscaled.generatedImages().get().get(0).image().get().mimeType().orElse("image/png");
  }
}
