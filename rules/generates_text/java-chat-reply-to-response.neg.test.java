// lexcode-expect: 0
// Model calls whose output stays with the team that runs them, and lookalikes that call no text model.
package com.example.negative.text;

import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;

public class TicketDigest {
  private static final Logger log = LoggerFactory.getLogger(TicketDigest.class);

  private final OpenAIClient openai;
  private final ChatModel summarizer;
  private final ChatClient chatClient;
  private final TicketRepository tickets;

  public TicketDigest(OpenAIClient openai, ChatModel summarizer, ChatClient chatClient, TicketRepository tickets) {
    this.openai = openai;
    this.summarizer = summarizer;
    this.chatClient = chatClient;
    this.tickets = tickets;
  }

  // bin/digest: an engineer runs it and reads the terminal and a notes file.
  public static void main(String[] args) throws Exception {
    OpenAIClient client = com.openai.client.okhttp.OpenAIOkHttpClient.fromEnv();
    ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
        .model("gpt-4o-mini")
        .addUserMessage("List the three biggest risks in this roadmap.")
        .build();
    ChatCompletion completion = client.chat().completions().create(params);
    String text = completion.choices().get(0).message().content().orElse("");
    System.out.println(text);
    Files.writeString(Path.of("risks.md"), text);
    log.info("risks: {}", text);
  }

  // The tag is written to an internal table the team queries.
  public void tag(Ticket ticket) {
    String tag = summarizer.chat("One word tag for: " + ticket.title());
    tickets.save(ticket.withTag(tag));
    String note = chatClient.prompt().user("Summarize: " + ticket.body()).call().content();
    log.info("ticket {} note {}", ticket.id(), note);
  }

  public void review(AnthropicClient claude, Ticket ticket) {
    MessageCreateParams params = MessageCreateParams.builder()
        .model("claude-sonnet-4-5")
        .maxTokens(400L)
        .addUserMessage("Is this ticket a duplicate? " + ticket.body())
        .build();
    Message message = claude.messages().create(params);
    tickets.save(ticket.withReview(message.content().toString()));
  }

  public void audit(BedrockRuntimeClient bedrock, Ticket ticket) {
    var response = bedrock.invokeModel(InvokeModelRequest.builder()
        .modelId("anthropic.claude-3-haiku-20240307-v1:0")
        .body(null)
        .build());
    log.info("audit {}", response.body());
  }

  // A forum client whose accessor happens to be called messages().
  @RestController
  public static class ForumController {
    private final ForumClient forum;
    private final EmbeddingModel embeddings;
    private final OpenAIClient openai;
    private final BedrockRuntimeClient bedrock;
    private final ChatService chatService;
    private final SseEmitter emitter = new SseEmitter();

    public ForumController(ForumClient forum, EmbeddingModel embeddings, OpenAIClient openai,
        BedrockRuntimeClient bedrock, ChatService chatService) {
      this.forum = forum;
      this.embeddings = embeddings;
      this.openai = openai;
      this.bedrock = bedrock;
      this.chatService = chatService;
    }

    @GetMapping("/forum/post")
    public Object post(@RequestParam String body) {
      var created = forum.messages().create(new ForumPost(body));
      return created;
    }

    // Embeddings and moderation scores are numbers, not text a model wrote.
    @GetMapping("/vector")
    public ResponseEntity<List<Float>> vector(@RequestParam String q) {
      var embedding = embeddings.embed(q).content().vectorAsList();
      return ResponseEntity.ok(embedding);
    }

    @GetMapping("/moderation")
    public Object moderation(@RequestParam String q) {
      var result = openai.moderations().create(
          com.openai.models.moderations.ModerationCreateParams.builder().input(q).build());
      return result.results();
    }

    @GetMapping("/embed")
    public Object embedWithBedrock(@RequestParam String q) {
      var response = bedrock.invokeModel(InvokeModelRequest.builder()
          .modelId("amazon.titan-embed-text-v2:0")
          .body(null)
          .build());
      return response.body();
    }

    // The assistant thread's stored messages are text a person wrote.
    @GetMapping("/thread")
    public Object thread(@RequestParam String id) {
      var posted = openai.beta().threads().messages().create(id,
          com.openai.models.beta.threads.messages.MessageCreateParams.builder().build());
      return posted.id();
    }

    // An in-house service that happens to be called chat, with no model behind it.
    @GetMapping("/support")
    public ResponseEntity<String> support(@RequestParam String q) throws Exception {
      String reply = chatService.chat(q);
      emitter.send(reply);
      return ResponseEntity.ok(reply);
    }
  }
}
