// lexcode-expect: 116
// One function per source call this rule's sinks list (#13034), in each form that reaches it:
// returned from a method, and set in a field a method returns. A sink entry that stops matching
// drops a match here.
package com.example.calls;

import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.MessageCreateParams;
import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.completions.CompletionCreateParams;
import com.openai.models.responses.ResponseCreateParams;
import dev.langchain4j.model.chat.ChatModel;
import org.springframework.ai.chat.client.ChatClient;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelWithResponseStreamRequest;

public class Calls {
  private static final String PROMPT = "Write a haiku.";
  private OpenAIClient openai;
  private AnthropicClient claude;
  private ChatModel model;
  private ChatClient chatClient;
  private BedrockRuntimeClient bedrock;
  private ChatCompletionCreateParams chatParams;
  private ResponseCreateParams responseParams;
  private CompletionCreateParams completionParams;
  private MessageCreateParams messageParams;

  Object m1(String q) {
    var r = openai.chat().completions().create(chatParams);
    return r;
  }

  private final Object f1 = openai.chat().completions().create(chatParams);

  Object g1() {
    return f1;
  }

  Object fe1(String q) {
    for (Object x : java.util.List.of(openai.chat().completions().create(chatParams))) {
      return x;
    }
    return null;
  }

  Object if1(String q) {
    Object r;
    if ((r = openai.chat().completions().create(chatParams)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam1 = q -> {
    var r = openai.chat().completions().create(chatParams);
    return r;
  };

  Object m2(String q) {
    var r = openai.responses().create(responseParams);
    return r;
  }

  private final Object f2 = openai.responses().create(responseParams);

  Object g2() {
    return f2;
  }

  Object fe2(String q) {
    for (Object x : java.util.List.of(openai.responses().create(responseParams))) {
      return x;
    }
    return null;
  }

  Object if2(String q) {
    Object r;
    if ((r = openai.responses().create(responseParams)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam2 = q -> {
    var r = openai.responses().create(responseParams);
    return r;
  };

  Object m3(String q) {
    var r = openai.completions().create(completionParams);
    return r;
  }

  private final Object f3 = openai.completions().create(completionParams);

  Object g3() {
    return f3;
  }

  Object fe3(String q) {
    for (Object x : java.util.List.of(openai.completions().create(completionParams))) {
      return x;
    }
    return null;
  }

  Object if3(String q) {
    Object r;
    if ((r = openai.completions().create(completionParams)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam3 = q -> {
    var r = openai.completions().create(completionParams);
    return r;
  };

  Object m4(String q) {
    var r = claude.messages().create(messageParams);
    return r;
  }

  private final Object f4 = claude.messages().create(messageParams);

  Object g4() {
    return f4;
  }

  Object fe4(String q) {
    for (Object x : java.util.List.of(claude.messages().create(messageParams))) {
      return x;
    }
    return null;
  }

  Object if4(String q) {
    Object r;
    if ((r = claude.messages().create(messageParams)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam4 = q -> {
    var r = claude.messages().create(messageParams);
    return r;
  };

  Object m5(String q) {
    var r = bedrock.invokeModel(InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build());
    return r;
  }

  private final Object f5 = bedrock.invokeModel(InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build());

  Object g5() {
    return f5;
  }

  Object fe5(String q) {
    for (Object x : java.util.List.of(bedrock.invokeModel(InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build()))) {
      return x;
    }
    return null;
  }

  Object if5(String q) {
    Object r;
    if ((r = bedrock.invokeModel(InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build())) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam5 = q -> {
    var r = bedrock.invokeModel(InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build());
    return r;
  };

  Object m6(String q) {
    var r = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build());
    return r;
  }

  private final Object f6 = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build());

  Object g6() {
    return f6;
  }

  Object fe6(String q) {
    for (Object x : java.util.List.of(bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build()))) {
      return x;
    }
    return null;
  }

  Object if6(String q) {
    Object r;
    if ((r = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build())) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam6 = q -> {
    var r = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build());
    return r;
  };

  Object m7(String q) {
    var r = model.getChatCompletions(q);
    return r;
  }

  private final Object f7 = model.getChatCompletions(PROMPT);

  Object g7() {
    return f7;
  }

  Object fe7(String q) {
    for (Object x : java.util.List.of(model.getChatCompletions(q))) {
      return x;
    }
    return null;
  }

  Object if7(String q) {
    Object r;
    if ((r = model.getChatCompletions(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam7 = q -> {
    var r = model.getChatCompletions(q);
    return r;
  };

  Object m8(String q) {
    var r = model.getChatCompletionsStream(q);
    return r;
  }

  private final Object f8 = model.getChatCompletionsStream(PROMPT);

  Object g8() {
    return f8;
  }

  Object fe8(String q) {
    for (Object x : java.util.List.of(model.getChatCompletionsStream(q))) {
      return x;
    }
    return null;
  }

  Object if8(String q) {
    Object r;
    if ((r = model.getChatCompletionsStream(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam8 = q -> {
    var r = model.getChatCompletionsStream(q);
    return r;
  };

  Object m9(String q) {
    var r = model.getChatCompletionsWithResponse(q);
    return r;
  }

  private final Object f9 = model.getChatCompletionsWithResponse(PROMPT);

  Object g9() {
    return f9;
  }

  Object fe9(String q) {
    for (Object x : java.util.List.of(model.getChatCompletionsWithResponse(q))) {
      return x;
    }
    return null;
  }

  Object if9(String q) {
    Object r;
    if ((r = model.getChatCompletionsWithResponse(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam9 = q -> {
    var r = model.getChatCompletionsWithResponse(q);
    return r;
  };

  Object m10(String q) {
    var r = model.getCompletions(q);
    return r;
  }

  private final Object f10 = model.getCompletions(PROMPT);

  Object g10() {
    return f10;
  }

  Object fe10(String q) {
    for (Object x : java.util.List.of(model.getCompletions(q))) {
      return x;
    }
    return null;
  }

  Object if10(String q) {
    Object r;
    if ((r = model.getCompletions(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam10 = q -> {
    var r = model.getCompletions(q);
    return r;
  };

  Object m11(String q) {
    var r = model.getCompletionsStream(q);
    return r;
  }

  private final Object f11 = model.getCompletionsStream(PROMPT);

  Object g11() {
    return f11;
  }

  Object fe11(String q) {
    for (Object x : java.util.List.of(model.getCompletionsStream(q))) {
      return x;
    }
    return null;
  }

  Object if11(String q) {
    Object r;
    if ((r = model.getCompletionsStream(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam11 = q -> {
    var r = model.getCompletionsStream(q);
    return r;
  };

  Object m12(String q) {
    var r = model.complete(q);
    return r;
  }

  private final Object f12 = model.complete(PROMPT);

  Object g12() {
    return f12;
  }

  Object fe12(String q) {
    for (Object x : java.util.List.of(model.complete(q))) {
      return x;
    }
    return null;
  }

  Object if12(String q) {
    Object r;
    if ((r = model.complete(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam12 = q -> {
    var r = model.complete(q);
    return r;
  };

  Object m13(String q) {
    var r = model.completeStream(q);
    return r;
  }

  private final Object f13 = model.completeStream(PROMPT);

  Object g13() {
    return f13;
  }

  Object fe13(String q) {
    for (Object x : java.util.List.of(model.completeStream(q))) {
      return x;
    }
    return null;
  }

  Object if13(String q) {
    Object r;
    if ((r = model.completeStream(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam13 = q -> {
    var r = model.completeStream(q);
    return r;
  };

  Object m14(String q) {
    var r = model.converse(q);
    return r;
  }

  private final Object f14 = model.converse(PROMPT);

  Object g14() {
    return f14;
  }

  Object fe14(String q) {
    for (Object x : java.util.List.of(model.converse(q))) {
      return x;
    }
    return null;
  }

  Object if14(String q) {
    Object r;
    if ((r = model.converse(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam14 = q -> {
    var r = model.converse(q);
    return r;
  };

  Object m15(String q) {
    var r = model.converseStream(q);
    return r;
  }

  private final Object f15 = model.converseStream(PROMPT);

  Object g15() {
    return f15;
  }

  Object fe15(String q) {
    for (Object x : java.util.List.of(model.converseStream(q))) {
      return x;
    }
    return null;
  }

  Object if15(String q) {
    Object r;
    if ((r = model.converseStream(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam15 = q -> {
    var r = model.converseStream(q);
    return r;
  };

  Object m16(String q) {
    var r = model.chat(q);
    return r;
  }

  private final Object f16 = model.chat(PROMPT);

  Object g16() {
    return f16;
  }

  Object fe16(String q) {
    for (Object x : java.util.List.of(model.chat(q))) {
      return x;
    }
    return null;
  }

  Object if16(String q) {
    Object r;
    if ((r = model.chat(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam16 = q -> {
    var r = model.chat(q);
    return r;
  };

  Object m17(String q) {
    var r = model.generate(q);
    return r;
  }

  private final Object f17 = model.generate(PROMPT);

  Object g17() {
    return f17;
  }

  Object fe17(String q) {
    for (Object x : java.util.List.of(model.generate(q))) {
      return x;
    }
    return null;
  }

  Object if17(String q) {
    Object r;
    if ((r = model.generate(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam17 = q -> {
    var r = model.generate(q);
    return r;
  };

  Object m18(String q) {
    var r = model.generateAsync(q);
    return r;
  }

  private final Object f18 = model.generateAsync(PROMPT);

  Object g18() {
    return f18;
  }

  Object fe18(String q) {
    for (Object x : java.util.List.of(model.generateAsync(q))) {
      return x;
    }
    return null;
  }

  Object if18(String q) {
    Object r;
    if ((r = model.generateAsync(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam18 = q -> {
    var r = model.generateAsync(q);
    return r;
  };

  Object m19(String q) {
    var r = model.call(q);
    return r;
  }

  private final Object f19 = model.call(PROMPT);

  Object g19() {
    return f19;
  }

  Object fe19(String q) {
    for (Object x : java.util.List.of(model.call(q))) {
      return x;
    }
    return null;
  }

  Object if19(String q) {
    Object r;
    if ((r = model.call(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam19 = q -> {
    var r = model.call(q);
    return r;
  };

  Object m20(String q) {
    var r = model.stream(q);
    return r;
  }

  private final Object f20 = model.stream(PROMPT);

  Object g20() {
    return f20;
  }

  Object fe20(String q) {
    for (Object x : java.util.List.of(model.stream(q))) {
      return x;
    }
    return null;
  }

  Object if20(String q) {
    Object r;
    if ((r = model.stream(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam20 = q -> {
    var r = model.stream(q);
    return r;
  };

  Object m21(String q) {
    var r = model.chatComplete(q);
    return r;
  }

  private final Object f21 = model.chatComplete(PROMPT);

  Object g21() {
    return f21;
  }

  Object fe21(String q) {
    for (Object x : java.util.List.of(model.chatComplete(q))) {
      return x;
    }
    return null;
  }

  Object if21(String q) {
    Object r;
    if ((r = model.chatComplete(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam21 = q -> {
    var r = model.chatComplete(q);
    return r;
  };

  Object m22(String q) {
    var r = chatClient.prompt().user(q).call();
    return r;
  }

  private final Object f22 = chatClient.prompt().user(PROMPT).call();

  Object g22() {
    return f22;
  }

  Object fe22(String q) {
    for (Object x : java.util.List.of(chatClient.prompt().user(q).call())) {
      return x;
    }
    return null;
  }

  Object if22(String q) {
    Object r;
    if ((r = chatClient.prompt().user(q).call()) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam22 = q -> {
    var r = chatClient.prompt().user(q).call();
    return r;
  };

  Object m23(String q) {
    var r = chatClient.prompt().user(q).stream();
    return r;
  }

  private final Object f23 = chatClient.prompt().user(PROMPT).stream();

  Object g23() {
    return f23;
  }

  Object fe23(String q) {
    for (Object x : java.util.List.of(chatClient.prompt().user(q).stream())) {
      return x;
    }
    return null;
  }

  Object if23(String q) {
    Object r;
    if ((r = chatClient.prompt().user(q).stream()) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam23 = q -> {
    var r = chatClient.prompt().user(q).stream();
    return r;
  };

  Object viaThis() {
    return this.f1;
  }
}
