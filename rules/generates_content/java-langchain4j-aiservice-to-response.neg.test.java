// lexcode-expect: 0
// AI Services whose output stays with the team that runs them, factories that only build the service, and retrieval.
package com.example.negative.aiservice;

import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.rag.content.retriever.EmbeddingStoreContentRetriever;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.service.SystemMessage;
import dev.langchain4j.service.UserMessage;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Configuration
public class AssistantConfig {
  private static final Logger log = LoggerFactory.getLogger(AssistantConfig.class);

  public interface Triage {
    @SystemMessage("Classify the support ticket as billing, bug or other.")
    String category(@UserMessage String ticket);
  }

  // Building the service hands back the service, not anything it wrote.
  @Bean
  public Triage triage(ChatModel model) {
    return AiServices.builder(Triage.class)
        .chatModel(model)
        .chatMemory(MessageWindowChatMemory.withMaxMessages(10))
        .build();
  }

  public Triage plain(ChatModel model) {
    return AiServices.create(Triage.class, model);
  }

  // The category is written to an internal table the team queries.
  public void classify(ChatModel model, TicketRepository tickets, Ticket ticket) {
    Triage triage = AiServices.create(Triage.class, model);
    String category = triage.category(ticket.body());
    tickets.save(ticket.withCategory(category));
    log.info("ticket {} is {}", ticket.id(), category);
  }

  // Retrieval returns stored passages, not text a model wrote.
  @RestController
  public static class PassageController {
    private final EmbeddingStoreContentRetriever retriever;
    private final EmbeddingModel embeddings;

    public PassageController(EmbeddingStoreContentRetriever retriever, EmbeddingModel embeddings) {
      this.retriever = retriever;
      this.embeddings = embeddings;
    }

    @GetMapping("/passages")
    public ResponseEntity<List<String>> passages(@RequestParam String q) {
      var contents = retriever.retrieve(dev.langchain4j.rag.query.Query.from(q));
      return ResponseEntity.ok(contents.stream().map(c -> c.textSegment().text()).toList());
    }
  }
}
