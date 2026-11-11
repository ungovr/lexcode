// lexcode-expect: 0
// Video-model calls whose output stays with the team that runs them, and footage a person shot that the app only streams or trims.
package com.example.negative.video;

import com.google.genai.Client;
import com.openai.client.OpenAIClient;
import com.openai.models.videos.VideoCreateParams;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

public class StoryboardJob {
  private static final Logger log = LoggerFactory.getLogger(StoryboardJob.class);

  // bin/storyboard: a producer runs it and watches the files it writes.
  public static void main(String[] args) throws Exception {
    Client genai = Client.builder().apiKey(System.getenv("GOOGLE_API_KEY")).build();
    var operation = genai.models.generateVideos("veo-3.0-generate-001", "A drone shot over a harbor at dawn", null, null);
    log.info("started {}", operation.name().orElse("unnamed"));

    OpenAIClient openai = com.openai.client.okhttp.OpenAIOkHttpClient.fromEnv();
    var video = openai.videos().create(VideoCreateParams.builder().prompt("A harbor at dawn").build());
    Files.writeString(Path.of("jobs.log"), video.id());
  }

  // Footage a person shot, served as it is.
  @RestController
  public static class ClipController {
    private final ClipStore clips;

    public ClipController(ClipStore clips) {
      this.clips = clips;
    }

    @GetMapping("/clips/{name}")
    public ResponseEntity<Resource> clip(@PathVariable String name) {
      return ResponseEntity.ok(new FileSystemResource(clips.path(name)));
    }

    @GetMapping("/clips/{name}/raw")
    public void raw(@PathVariable String name, HttpServletResponse resp) throws IOException {
      try (InputStream in = Files.newInputStream(clips.path(name))) {
        in.transferTo(resp.getOutputStream());
      }
    }
  }
}

// An in-house catalog whose method name sounds like a video-model call. It lists clips people uploaded.
@RestController
class CatalogController {
  private final VideoCatalog videos;

  CatalogController(VideoCatalog videos) {
    this.videos = videos;
  }

  @GetMapping("/catalog/{id}")
  public ResponseEntity<Object> catalog(@PathVariable String id) {
    var listing = videos.generateVideos(id);
    return ResponseEntity.ok(listing);
  }

  @GetMapping("/catalog/{id}/raw")
  public Object raw(@PathVariable String id) {
    return videos.generateVideos(id);
  }
}
