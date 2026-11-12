// lexcode-expect: 7
package com.example.content;

import com.google.cloud.vertexai.api.GenerateContentResponse;
import com.google.cloud.vertexai.generativeai.ChatSession;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import com.google.genai.Client;
import com.google.genai.ResponseStream;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class GeminiController {
  private final Client client;
  private final GenerativeModel vertex;
  private final ChatSession session;

  public GeminiController(Client client, GenerativeModel vertex, ChatSession session) {
    this.client = client;
    this.vertex = vertex;
    this.session = session;
  }

  // Whatever the model returns, text or an image, is the response body.
  @PostMapping("/caption")
  public String caption(@RequestParam String text) {
    var response = client.models.generateContent("gemini-2.5-flash", "Caption this: " + text, null);
    return response.text();
  }

  @GetMapping("/describe")
  public ResponseEntity<String> describe(@RequestParam String photoUrl) {
    var response = client.models.generateContent("gemini-2.5-flash", "Describe this picture: " + photoUrl, null);
    return ResponseEntity.ok(response.text());
  }

  // Vertex AI.
  @GetMapping("/vertex")
  public String vertex(@RequestParam String q) throws IOException {
    GenerateContentResponse response = vertex.generateContent(q);
    return ResponseHandler.getText(response);
  }

  @GetMapping("/chat")
  public ResponseEntity<String> chat(@RequestParam String q) throws IOException {
    GenerateContentResponse response = session.sendMessage(q);
    return ResponseEntity.ok().body(ResponseHandler.getText(response));
  }

  // The streamed parts are written to the browser as they arrive.
  @GetMapping("/story")
  public SseEmitter story(@RequestParam String topic) {
    SseEmitter emitter = new SseEmitter();
    ResponseStream<com.google.genai.types.GenerateContentResponse> chunks =
        client.models.generateContentStream("gemini-2.5-flash", "Tell a story about " + topic, null);
    for (var chunk : chunks) {
      try {
        emitter.send(chunk.text());
      } catch (IOException e) {
        emitter.completeWithError(e);
      }
    }
    return emitter;
  }

  // A server-rendered page and a servlet.
  @GetMapping("/page")
  public String page(@RequestParam String q, Model model) {
    var response = client.models.generateContent("gemini-2.5-flash", q, null);
    model.addAttribute("answer", response.text());
    return "answer";
  }

  public void servlet(String q, HttpServletResponse resp) throws IOException {
    var response = client.chats.create("gemini-2.5-flash").sendMessage(q);
    resp.getWriter().println(response.text());
  }
}
