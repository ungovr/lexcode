// lexcode-expect: 7
package com.example.text.returned;

import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.Message;
import com.anthropic.models.messages.MessageCreateParams;
import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import dev.langchain4j.model.chat.ChatModel;
import java.util.Optional;
import java.util.stream.Stream;
import org.springframework.ai.chat.client.ChatClient;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;

public class Writers {
  private final OpenAIClient openai;
  private final AnthropicClient claude;
  private final ChatModel model;
  private final ChatClient chatClient;
  private final BedrockRuntimeClient bedrock;

  public Writers(OpenAIClient openai, AnthropicClient claude, ChatModel model, ChatClient chatClient,
      BedrockRuntimeClient bedrock) {
    this.openai = openai;
    this.claude = claude;
    this.model = model;
    this.chatClient = chatClient;
    this.bedrock = bedrock;
  }

  // A service method hands the model's text to its caller. Where that text goes is not
  // visible here, so the match is a signal.
  public String summarize(String text) {
    ChatCompletion completion = openai.chat().completions().create(
        ChatCompletionCreateParams.builder()
            .model("gpt-4o-mini")
            .addUserMessage("Summarize:\n" + text)
            .build());
    return completion.choices().get(0).message().content().orElse("");
  }

  public Optional<String> draftReply(String email) {
    MessageCreateParams params = MessageCreateParams.builder()
        .model("claude-sonnet-4-5")
        .maxTokens(600L)
        .addUserMessage("Draft a polite reply to:\n" + email)
        .build();
    Message message = claude.messages().create(params);
    return message.content().get(0).text().map(block -> block.text());
  }

  public String headline(String article) {
    return model.chat("Write a headline for: " + article);
  }

  public String describe(String name) {
    return chatClient.prompt().user("Describe " + name + " in two sentences.").call().content();
  }

  public Stream<String> streamStory(String topic) {
    var stream = openai.chat().completions().createStreaming(
        ChatCompletionCreateParams.builder().model("gpt-4o-mini").addUserMessage("Tell a story about " + topic).build());
    return stream.stream().map(chunk -> chunk.choices().get(0).delta().content().orElse(""));
  }

  public String viaBedrock(String prompt) {
    var response = bedrock.converse(r -> r.modelId("amazon.nova-lite-v1:0").messages(m -> m.content(c -> c.text(prompt))));
    return response.output().message().content().get(0).text();
  }

  // A route that answers the request itself belongs to the evidence rule, so it is not here.
  public String trimmed(String prompt) {
    String reply = model.chat(prompt);
    return reply.strip();
  }
}
