// lexcode-expect: 5
package com.example.video;

import com.google.genai.Client;
import com.openai.client.OpenAIClient;
import com.openai.models.videos.VideoCreateParams;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.StartAsyncInvokeRequest;

@RestController
public class ClipController {
  private final Client genai;
  private final OpenAIClient openai;
  private final BedrockRuntimeClient bedrock;

  public ClipController(Client genai, OpenAIClient openai, BedrockRuntimeClient bedrock) {
    this.genai = genai;
    this.openai = openai;
    this.bedrock = bedrock;
  }

  // The clip the model renders, or the handle to it, is the response.
  @PostMapping("/clips")
  public ResponseEntity<String> create(@RequestParam String prompt) {
    var operation = genai.models.generateVideos("veo-3.0-generate-001", prompt, null, null);
    return ResponseEntity.ok(operation.name().orElse(""));
  }

  @GetMapping("/promo")
  public String promo(@RequestParam String product) {
    var video = openai.videos().create(VideoCreateParams.builder().prompt("A promo for " + product).build());
    return video.id();
  }

  @GetMapping("/promo/{id}/file")
  public void download(@RequestParam String id, HttpServletResponse resp) throws IOException {
    var content = openai.videos().downloadContent(id);
    content.body().transferTo(resp.getOutputStream());
  }

  @PostMapping("/nova")
  public ResponseEntity<String> nova(@RequestParam String prompt) {
    var invocation = bedrock.startAsyncInvoke(StartAsyncInvokeRequest.builder()
        .modelId("amazon.nova-reel-v1:1")
        .modelInput(null)
        .build());
    return ResponseEntity.ok(invocation.invocationArn());
  }

  // A mobile screen plays the clip.
  public static class PromoActivity extends android.app.Activity {
    private android.widget.VideoView videoView;
    private Client genai;

    void play(String prompt) {
      var operation = genai.models.generateVideos("veo-3.0-generate-001", prompt, null, null);
      android.net.Uri uri = android.net.Uri.parse(operation.name().orElse(""));
      videoView.setVideoURI(uri);
    }
  }
}
