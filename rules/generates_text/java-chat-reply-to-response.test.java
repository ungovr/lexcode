// lexcode-expect: 17
package com.example.text;

import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.azure.ai.openai.OpenAIClient;
import com.openai.client.OpenAIClient;
import com.openai.core.http.StreamResponse;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionChunk;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.chat.StreamingChatModel;
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler;
import io.javalin.http.Context;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.core.Response;
import java.io.IOException;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.http.ResponseEntity;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import reactor.core.publisher.Flux;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;

@RestController
public class AnswerController {
  private final com.openai.client.OpenAIClient openai;
  private final AnthropicClient claude;
  private final ChatModel chatModel;
  private final StreamingChatModel streamingModel;
  private final ChatClient chatClient;
  private final BedrockRuntimeClient bedrock;

  public AnswerController(com.openai.client.OpenAIClient openai, AnthropicClient claude, ChatModel chatModel,
      StreamingChatModel streamingModel, ChatClient chatClient, BedrockRuntimeClient bedrock) {
    this.openai = openai;
    this.claude = claude;
    this.chatModel = chatModel;
    this.streamingModel = streamingModel;
    this.chatClient = chatClient;
    this.bedrock = bedrock;
  }

  // Whatever the model wrote is the response body.
  @GetMapping("/answer")
  public String answer(@RequestParam String question) {
    ChatCompletion completion = openai.chat().completions().create(
        com.openai.models.chat.completions.ChatCompletionCreateParams.builder()
            .model("gpt-4o-mini")
            .addUserMessage(question)
            .build());
    return completion.choices().get(0).message().content().orElse("");
  }

  @PostMapping("/draft")
  public ResponseEntity<String> draft(@RequestParam String email) {
    MessageCreateParams params = MessageCreateParams.builder()
        .model("claude-sonnet-4-5")
        .maxTokens(600L)
        .addUserMessage("Draft a polite reply to: " + email)
        .build();
    Message message = claude.messages().create(params);
    return ResponseEntity.ok(message.content().get(0).text().get().text());
  }

  // A streamed reply is pushed to the browser as server-sent events.
  @GetMapping("/story")
  public SseEmitter story(@RequestParam String topic) {
    SseEmitter emitter = new SseEmitter();
    StreamResponse<ChatCompletionChunk> stream = openai.chat().completions().createStreaming(
        com.openai.models.chat.completions.ChatCompletionCreateParams.builder()
            .model("gpt-4o-mini")
            .addUserMessage("Tell a story about " + topic)
            .build());
    stream.stream().forEach(chunk -> {
      try {
        emitter.send(chunk.choices().get(0).delta().content().orElse(""));
      } catch (IOException e) {
        emitter.completeWithError(e);
      }
    });
    return emitter;
  }

  // LangChain4j: the token callback writes straight to the emitter.
  @GetMapping("/tokens")
  public SseEmitter tokens(@RequestParam String q) {
    SseEmitter emitter = new SseEmitter();
    streamingModel.chat(q, new StreamingChatResponseHandler() {
      @Override
      public void onPartialResponse(String token) {
        try {
          emitter.send(token);
        } catch (IOException e) {
          emitter.completeWithError(e);
        }
      }

      @Override
      public void onCompleteResponse(dev.langchain4j.model.chat.response.ChatResponse response) {
        emitter.complete();
      }

      @Override
      public void onError(Throwable error) {
        emitter.completeWithError(error);
      }
    });
    return emitter;
  }

  @GetMapping("/reactive")
  public Flux<String> reactive(@RequestParam String q) {
    return chatClient.prompt().user(q).stream().content();
  }

  @GetMapping("/blocking")
  public String blocking(@RequestParam String q) {
    String reply = chatClient.prompt().user(q).call().content();
    return reply;
  }

  // The page template shows the answer.
  @GetMapping("/page")
  public String page(@RequestParam String q, Model model) {
    String reply = chatModel.chat(q);
    model.addAttribute("answer", reply);
    return "answer";
  }

  @GetMapping("/bedrock")
  public ResponseEntity<String> viaBedrock(@RequestParam String q) {
    var response = bedrock.invokeModel(InvokeModelRequest.builder()
        .modelId("anthropic.claude-3-haiku-20240307-v1:0")
        .body(null)
        .build());
    return ResponseEntity.ok().header("Cache-Control", "no-store").body(response.body().asUtf8String());
  }

  @GetMapping("/converse")
  public void converse(@RequestParam String q, HttpServletResponse servletResponse) throws IOException {
    var result = bedrock.converse(r -> r.modelId("amazon.nova-lite-v1:0").messages(m -> m.content(c -> c.text(q))));
    servletResponse.getWriter().write(result.output().message().content().get(0).text());
  }

  // Azure OpenAI.
  public void azure(com.azure.ai.openai.OpenAIClient azureClient, String q, HttpServletResponse out) throws IOException {
    var completions = azureClient.getChatCompletions("my-deployment", options(q));
    out.getWriter().println(completions.getChoices().get(0).getMessage().getContent());
  }

  // WebSocket chat.
  public void socket(WebSocketSession session, String q) throws IOException {
    String reply = chatModel.chat(q);
    session.sendMessage(new TextMessage(reply));
  }

  // A mobile screen shows the draft.
  public static class DraftActivity extends android.app.Activity {
    private android.widget.TextView draftView;
    private com.openai.client.OpenAIClient client;

    void load(String prompt) {
      new Thread(() -> {
        ChatCompletion completion = client.chat().completions().create(
            com.openai.models.chat.completions.ChatCompletionCreateParams.builder()
                .model("gpt-4o-mini")
                .addUserMessage(prompt)
                .build());
        String draft = completion.choices().get(0).message().content().orElse("");
        runOnUiThread(() -> draftView.setText(draft));
      }).start();
    }
  }

  // JAX-RS.
  public static class AskResource {
    private ChatModel model;

    @GET
    public Response ask() {
      String reply = model.chat("Say hello");
      return Response.ok(reply).build();
    }
  }

  // Javalin.
  public static void routes(io.javalin.Javalin app, ChatModel model) {
    app.get("/hello", ctx -> {
      String reply = model.chat(ctx.queryParam("q"));
      ctx.result(reply);
    });
  }

  // Ollama4j and an optional unwrapped late.
  @GetMapping("/local")
  public String local(io.github.ollama4j.OllamaAPI ollama) throws Exception {
    var result = ollama.generate("llama3", "Why is the sky blue?", false, null);
    return result.getResponse();
  }

  // Spring AI model with a typed prompt.
  public ResponseEntity<String> springAiModel(org.springframework.ai.openai.OpenAiChatModel model) {
    var response = model.call(new org.springframework.ai.chat.prompt.Prompt("Hello"));
    return ResponseEntity.ok(response.getResult().getOutput().getText());
  }

  // The token callback of a LangChain4j TokenStream.
  public void tokenStream(Assistant assistant, SseEmitter emitter, String q) {
    assistant.chat(q).onPartialResponse(token -> {
      try {
        emitter.send(token);
      } catch (IOException e) {
        emitter.completeWithError(e);
      }
    }).start();
  }

  private com.azure.ai.openai.models.ChatCompletionsOptions options(String q) {
    return new com.azure.ai.openai.models.ChatCompletionsOptions(java.util.List.of());
  }
}
