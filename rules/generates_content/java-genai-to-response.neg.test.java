// lexcode-expect: 0
// Gemini and AI Service calls whose output stays with the team that runs them, and lookalikes that call no model.
package com.example.negative.content;

import com.google.cloud.vertexai.api.GenerateContentResponse;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import com.google.genai.Client;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.service.AiServices;
import dev.langchain4j.store.embedding.EmbeddingStore;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

public class RoadmapReview {
  private static final Logger log = LoggerFactory.getLogger(RoadmapReview.class);

  // bin/risks: an engineer runs it and reads the terminal.
  public static void main(String[] args) throws Exception {
    Client client = Client.builder().apiKey(System.getenv("GOOGLE_API_KEY")).build();
    var result = client.models.generateContent("gemini-2.5-flash", "List the three biggest risks in this roadmap.", null);
    String text = result.text();
    System.out.println(text);
    Files.writeString(Path.of("risks.md"), text);
    log.info("risks: {}", text);

    GenerativeModel model = new GenerativeModel("gemini-1.5-flash", null);
    GenerateContentResponse response = model.generateContent("Group these support tickets by theme.");
    System.err.println(ResponseHandler.getText(response));
  }

  // The classification is written to an internal table the team queries.
  public static class TicketTagger {
    private final Client client;
    private final TicketRepository tickets;
    private final Triage triage;

    public TicketTagger(Client client, TicketRepository tickets, Triage triage) {
      this.client = client;
      this.tickets = tickets;
      this.triage = triage;
    }

    public void tag(Ticket ticket) {
      var response = client.models.generateContent("gemini-2.5-flash", "One word tag for: " + ticket.title(), null);
      tickets.save(ticket.withTag(response.text()));
      String urgency = triage.urgency(ticket.body());
      tickets.save(ticket.withUrgency(urgency));
    }

    public static Triage build(dev.langchain4j.model.chat.ChatModel model) {
      return AiServices.create(Triage.class, model);
    }
  }

  // Retrieval over a vector store and embeddings are not generated content.
  @RestController
  public static class SearchController {
    private final EmbeddingModel embeddings;
    private final EmbeddingStore<dev.langchain4j.data.segment.TextSegment> store;
    private final PageBuilder pages;

    public SearchController(EmbeddingModel embeddings, EmbeddingStore<dev.langchain4j.data.segment.TextSegment> store,
        PageBuilder pages) {
      this.embeddings = embeddings;
      this.store = store;
      this.pages = pages;
    }

    @GetMapping("/search")
    public ResponseEntity<List<String>> search(@RequestParam String q) {
      var vector = embeddings.embed(q).content();
      var hits = store.search(
          dev.langchain4j.store.embedding.EmbeddingSearchRequest.builder().queryEmbedding(vector).maxResults(10).build());
      return ResponseEntity.ok(hits.matches().stream().map(m -> m.embedded().text()).toList());
    }

    // A method named generateContent that calls no model.
    @GetMapping("/page")
    public String page(@RequestParam long id) {
      return pages.generateContent(id);
    }
  }

  public interface Triage {
    String urgency(String body);
  }
}
