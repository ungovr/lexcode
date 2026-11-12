// lexcode-expect: 5
package com.example.aiservice;

import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.TokenStream;
import dev.langchain4j.service.UserMessage;
import java.io.IOException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
public class AssistantController {
  public interface Writer {
    @SystemMessage("You write short product descriptions.")
    String describe(@UserMessage String product);
  }

  public interface Teller {
    TokenStream tell(@UserMessage String topic);
  }

  private final ChatModel model;
  private final dev.langchain4j.model.chat.StreamingChatModel streaming;

  public AssistantController(ChatModel model, dev.langchain4j.model.chat.StreamingChatModel streaming) {
    this.model = model;
    this.streaming = streaming;
  }

  // The AI Service's return type is whatever the interface declares, so the kind of
  // content is not fixed here.
  @PostMapping("/describe")
  public String describe(@RequestParam String product) {
    Writer writer = AiServices.create(Writer.class, model);
    return writer.describe(product);
  }

  @GetMapping("/describe-wrapped")
  public ResponseEntity<String> describeWrapped(@RequestParam String product) {
    Writer writer = AiServices.builder(Writer.class).chatModel(model).build();
    return ResponseEntity.ok(writer.describe(product));
  }

  @GetMapping("/story")
  public SseEmitter story(@RequestParam String topic) {
    SseEmitter emitter = new SseEmitter();
    Teller teller = AiServices.builder(Teller.class).streamingChatModel(streaming).build();
    teller.tell(topic).onPartialResponse(token -> {
      try {
        emitter.send(token);
      } catch (IOException e) {
        emitter.completeWithError(e);
      }
    }).start();
    return emitter;
  }

  @GetMapping("/inline")
  public String inline(@RequestParam String product) {
    return AiServices.create(Writer.class, model).describe(product);
  }

  @GetMapping("/twice")
  public ResponseEntity<String> twice(@RequestParam String product) {
    var writer = AiServices.create(Writer.class, model);
    String first = writer.describe(product);
    return ResponseEntity.ok().body(first);
  }
}
