// lexcode-expect: 0
// Methods that call an image model and keep the output, methods that return something else, and a resize.
package com.example.negative.image.returned;

import com.openai.client.OpenAIClient;
import com.openai.models.images.ImageGenerateParams;
import com.openai.models.images.ImagesResponse;
import java.awt.image.BufferedImage;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import javax.imageio.ImageIO;

public class CoverArtJob {
  private final OpenAIClient openai;
  private final AssetStore assets;

  public CoverArtJob(OpenAIClient openai, AssetStore assets) {
    this.openai = openai;
    this.assets = assets;
  }

  // The picture goes to the asset store; the method returns whether it worked.
  public boolean render(String title) throws IOException {
    ImagesResponse images = openai.images().generate(
        ImageGenerateParams.builder().model("gpt-image-1").prompt("Cover art for " + title).build());
    byte[] png = Base64.getDecoder().decode(images.data().get().get(0).b64Json().get());
    assets.put(title + ".png", png);
    return true;
  }

  public void archive(String title) throws IOException {
    ImagesResponse images = openai.images().generate(
        ImageGenerateParams.builder().model("gpt-image-1").prompt("Cover art for " + title).build());
    Files.writeString(Path.of("covers.log"), images.data().get().get(0).url().orElse("none"));
  }

  // A picture a person made, cropped.
  public BufferedImage crop(Path source) throws IOException {
    BufferedImage image = ImageIO.read(source.toFile());
    return image.getSubimage(0, 0, 100, 100);
  }

  public byte[] thumbnail(byte[] original) throws IOException {
    return assets.thumbnail(original, 64);
  }
}
