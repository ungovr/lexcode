// lexcode-expect: 47
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

  Object m2(String q) {
    var r = openai.responses().create(responseParams);
    return r;
  }

  private final Object f2 = openai.responses().create(responseParams);

  Object g2() {
    return f2;
  }

  Object m3(String q) {
    var r = openai.completions().create(completionParams);
    return r;
  }

  private final Object f3 = openai.completions().create(completionParams);

  Object g3() {
    return f3;
  }

  Object m4(String q) {
    var r = claude.messages().create(messageParams);
    return r;
  }

  private final Object f4 = claude.messages().create(messageParams);

  Object g4() {
    return f4;
  }

  Object m5(String q) {
    var r = bedrock.invokeModel(InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build());
    return r;
  }

  private final Object f5 = bedrock.invokeModel(InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build());

  Object g5() {
    return f5;
  }

  Object m6(String q) {
    var r = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build());
    return r;
  }

  private final Object f6 = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build());

  Object g6() {
    return f6;
  }

  Object m7(String q) {
    var r = model.getChatCompletions(q);
    return r;
  }

  private final Object f7 = model.getChatCompletions(PROMPT);

  Object g7() {
    return f7;
  }

  Object m8(String q) {
    var r = model.getChatCompletionsStream(q);
    return r;
  }

  private final Object f8 = model.getChatCompletionsStream(PROMPT);

  Object g8() {
    return f8;
  }

  Object m9(String q) {
    var r = model.getChatCompletionsWithResponse(q);
    return r;
  }

  private final Object f9 = model.getChatCompletionsWithResponse(PROMPT);

  Object g9() {
    return f9;
  }

  Object m10(String q) {
    var r = model.getCompletions(q);
    return r;
  }

  private final Object f10 = model.getCompletions(PROMPT);

  Object g10() {
    return f10;
  }

  Object m11(String q) {
    var r = model.getCompletionsStream(q);
    return r;
  }

  private final Object f11 = model.getCompletionsStream(PROMPT);

  Object g11() {
    return f11;
  }

  Object m12(String q) {
    var r = model.complete(q);
    return r;
  }

  private final Object f12 = model.complete(PROMPT);

  Object g12() {
    return f12;
  }

  Object m13(String q) {
    var r = model.completeStream(q);
    return r;
  }

  private final Object f13 = model.completeStream(PROMPT);

  Object g13() {
    return f13;
  }

  Object m14(String q) {
    var r = model.converse(q);
    return r;
  }

  private final Object f14 = model.converse(PROMPT);

  Object g14() {
    return f14;
  }

  Object m15(String q) {
    var r = model.converseStream(q);
    return r;
  }

  private final Object f15 = model.converseStream(PROMPT);

  Object g15() {
    return f15;
  }

  Object m16(String q) {
    var r = model.chat(q);
    return r;
  }

  private final Object f16 = model.chat(PROMPT);

  Object g16() {
    return f16;
  }

  Object m17(String q) {
    var r = model.generate(q);
    return r;
  }

  private final Object f17 = model.generate(PROMPT);

  Object g17() {
    return f17;
  }

  Object m18(String q) {
    var r = model.generateAsync(q);
    return r;
  }

  private final Object f18 = model.generateAsync(PROMPT);

  Object g18() {
    return f18;
  }

  Object m19(String q) {
    var r = model.call(q);
    return r;
  }

  private final Object f19 = model.call(PROMPT);

  Object g19() {
    return f19;
  }

  Object m20(String q) {
    var r = model.stream(q);
    return r;
  }

  private final Object f20 = model.stream(PROMPT);

  Object g20() {
    return f20;
  }

  Object m21(String q) {
    var r = model.chatComplete(q);
    return r;
  }

  private final Object f21 = model.chatComplete(PROMPT);

  Object g21() {
    return f21;
  }

  Object m22(String q) {
    var r = chatClient.prompt().user(q).call();
    return r;
  }

  private final Object f22 = chatClient.prompt().user(PROMPT).call();

  Object g22() {
    return f22;
  }

  Object m23(String q) {
    var r = chatClient.prompt().user(q).stream();
    return r;
  }

  private final Object f23 = chatClient.prompt().user(PROMPT).stream();

  Object g23() {
    return f23;
  }

  Object viaThis() {
    return this.f1;
  }
}
