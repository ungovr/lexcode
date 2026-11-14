// lexcode-expect: 106
// One function per source call this rule's sinks list (#13034), in each form that reaches it:
// returned from a block body, as an expression body, and set in a top-level val that a function
// returns. A sink entry that stops matching drops a match here.
package com.example.calls

import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import aws.sdk.kotlin.services.bedrockruntime.model.InvokeModelRequest
import aws.sdk.kotlin.services.bedrockruntime.model.InvokeModelWithResponseStreamRequest
import com.aallam.openai.client.OpenAI
import com.anthropic.client.AnthropicClient
import com.azure.ai.inference.ChatCompletionsClient
import com.azure.ai.openai.OpenAIClient as AzureClient
import com.openai.client.OpenAIClient

const val PROMPT = "Write a haiku."
val client: OpenAIClient = TODO()
val openai: OpenAIClient = TODO()
val anthropic: AnthropicClient = TODO()
val openAI: OpenAI = TODO()
val azure: AzureClient = TODO()
val chatClient: ChatCompletionsClient = TODO()
val bedrock: BedrockRuntimeClient = TODO()

val top1 = openai.chat().completions().create(PROMPT)

fun fromTop1(): Any {
  return top1
}

fun exprTop1() = top1

val top2 = client.responses().create(PROMPT)

fun fromTop2(): Any {
  return top2
}

fun exprTop2() = top2

val top3 = client.completions().create(PROMPT)

fun fromTop3(): Any {
  return top3
}

fun exprTop3() = top3

val top4 = anthropic.messages().create(PROMPT)

fun fromTop4(): Any {
  return top4
}

fun exprTop4() = top4

val top5 = openAI.chatCompletion(PROMPT)

fun fromTop5(): Any {
  return top5
}

fun exprTop5() = top5

val top6 = openAI.chatCompletions(PROMPT)

fun fromTop6(): Any {
  return top6
}

fun exprTop6() = top6

val top7 = openAI.completion(PROMPT)

fun fromTop7(): Any {
  return top7
}

fun exprTop7() = top7

val top8 = openAI.completions(PROMPT)

fun fromTop8(): Any {
  return top8
}

fun exprTop8() = top8

val top9 = azure.getChatCompletions("gpt-4o", PROMPT)

fun fromTop9(): Any {
  return top9
}

fun exprTop9() = top9

val top10 = azure.getChatCompletionsStream("gpt-4o", PROMPT)

fun fromTop10(): Any {
  return top10
}

fun exprTop10() = top10

val top11 = azure.getChatCompletionsWithResponse("gpt-4o", PROMPT, null)

fun fromTop11(): Any {
  return top11
}

fun exprTop11() = top11

val top12 = azure.getCompletions("gpt-4o", PROMPT)

fun fromTop12(): Any {
  return top12
}

fun exprTop12() = top12

val top13 = azure.getCompletionsStream("gpt-4o", PROMPT)

fun fromTop13(): Any {
  return top13
}

fun exprTop13() = top13

val top14 = azure.getCompletionsWithResponse("gpt-4o", PROMPT, null)

fun fromTop14(): Any {
  return top14
}

fun exprTop14() = top14

val top15 = chatClient.complete(PROMPT)

fun fromTop15(): Any {
  return top15
}

fun exprTop15() = top15

val top16 = chatClient.completeStream(PROMPT)

fun fromTop16(): Any {
  return top16
}

fun exprTop16() = top16

val top17 = bedrock.converse(PROMPT)

fun fromTop17(): Any {
  return top17
}

fun exprTop17() = top17

val top18 = bedrock.converseStream(PROMPT)

fun fromTop18(): Any {
  return top18
}

fun exprTop18() = top18

val top19 = bedrock.converse { modelId = "anthropic.claude-3-haiku" }

fun fromTop19(): Any {
  return top19
}

fun exprTop19() = top19

val top20 = bedrock.converseStream { modelId = "anthropic.claude-3-haiku" }

fun fromTop20(): Any {
  return top20
}

fun exprTop20() = top20

val top21 = bedrock.invokeModel { modelId = "anthropic.claude-3-haiku" }

fun fromTop21(): Any {
  return top21
}

fun exprTop21() = top21

val top22 = bedrock.invokeModelWithResponseStream { modelId = "anthropic.claude-3-haiku" }

fun fromTop22(): Any {
  return top22
}

fun exprTop22() = top22

val top23 = InvokeModelRequest { modelId = "anthropic.claude-3-haiku" }

fun fromTop23(): Any {
  return top23
}

fun exprTop23() = top23

val top24 = InvokeModelWithResponseStreamRequest { modelId = "anthropic.claude-3-haiku" }

fun fromTop24(): Any {
  return top24
}

fun exprTop24() = top24

val top25 = InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build()

fun fromTop25(): Any {
  return top25
}

fun exprTop25() = top25

val top26 = InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build()

fun fromTop26(): Any {
  return top26
}

fun exprTop26() = top26

class Calls(private val x: Int) {

  fun b1(q: String): Any {
    val r = openai.chat().completions().create(q)
    val t = r
    return t
  }

  fun e1(q: String) = openai.chat().completions().create(q)

  fun b2(q: String): Any {
    val r = client.responses().create(q)
    val t = r
    return t
  }

  fun e2(q: String) = client.responses().create(q)

  fun b3(q: String): Any {
    val r = client.completions().create(q)
    val t = r
    return t
  }

  fun e3(q: String) = client.completions().create(q)

  fun b4(q: String): Any {
    val r = anthropic.messages().create(q)
    val t = r
    return t
  }

  fun e4(q: String) = anthropic.messages().create(q)

  fun b5(q: String): Any {
    val r = openAI.chatCompletion(q)
    val t = r
    return t
  }

  fun e5(q: String) = openAI.chatCompletion(q)

  fun b6(q: String): Any {
    val r = openAI.chatCompletions(q)
    val t = r
    return t
  }

  fun e6(q: String) = openAI.chatCompletions(q)

  fun b7(q: String): Any {
    val r = openAI.completion(q)
    val t = r
    return t
  }

  fun e7(q: String) = openAI.completion(q)

  fun b8(q: String): Any {
    val r = openAI.completions(q)
    val t = r
    return t
  }

  fun e8(q: String) = openAI.completions(q)

  fun b9(q: String): Any {
    val r = azure.getChatCompletions("gpt-4o", q)
    val t = r
    return t
  }

  fun e9(q: String) = azure.getChatCompletions("gpt-4o", q)

  fun b10(q: String): Any {
    val r = azure.getChatCompletionsStream("gpt-4o", q)
    val t = r
    return t
  }

  fun e10(q: String) = azure.getChatCompletionsStream("gpt-4o", q)

  fun b11(q: String): Any {
    val r = azure.getChatCompletionsWithResponse("gpt-4o", q, null)
    val t = r
    return t
  }

  fun e11(q: String) = azure.getChatCompletionsWithResponse("gpt-4o", q, null)

  fun b12(q: String): Any {
    val r = azure.getCompletions("gpt-4o", q)
    val t = r
    return t
  }

  fun e12(q: String) = azure.getCompletions("gpt-4o", q)

  fun b13(q: String): Any {
    val r = azure.getCompletionsStream("gpt-4o", q)
    val t = r
    return t
  }

  fun e13(q: String) = azure.getCompletionsStream("gpt-4o", q)

  fun b14(q: String): Any {
    val r = azure.getCompletionsWithResponse("gpt-4o", q, null)
    val t = r
    return t
  }

  fun e14(q: String) = azure.getCompletionsWithResponse("gpt-4o", q, null)

  fun b15(q: String): Any {
    val r = chatClient.complete(q)
    val t = r
    return t
  }

  fun e15(q: String) = chatClient.complete(q)

  fun b16(q: String): Any {
    val r = chatClient.completeStream(q)
    val t = r
    return t
  }

  fun e16(q: String) = chatClient.completeStream(q)

  fun b17(q: String): Any {
    val r = bedrock.converse(q)
    val t = r
    return t
  }

  fun e17(q: String) = bedrock.converse(q)

  fun b18(q: String): Any {
    val r = bedrock.converseStream(q)
    val t = r
    return t
  }

  fun e18(q: String) = bedrock.converseStream(q)

  fun b19(q: String): Any {
    val r = bedrock.converse { modelId = "anthropic.claude-3-haiku" }
    val t = r
    return t
  }

  fun e19(q: String) = bedrock.converse { modelId = "anthropic.claude-3-haiku" }

  fun b20(q: String): Any {
    val r = bedrock.converseStream { modelId = "anthropic.claude-3-haiku" }
    val t = r
    return t
  }

  fun e20(q: String) = bedrock.converseStream { modelId = "anthropic.claude-3-haiku" }

  fun b21(q: String): Any {
    val r = bedrock.invokeModel { modelId = "anthropic.claude-3-haiku" }
    val t = r
    return t
  }

  fun e21(q: String) = bedrock.invokeModel { modelId = "anthropic.claude-3-haiku" }

  fun b22(q: String): Any {
    val r = bedrock.invokeModelWithResponseStream { modelId = "anthropic.claude-3-haiku" }
    val t = r
    return t
  }

  fun e22(q: String) = bedrock.invokeModelWithResponseStream { modelId = "anthropic.claude-3-haiku" }

  fun b23(q: String): Any {
    val r = InvokeModelRequest { modelId = "anthropic.claude-3-haiku" }
    val t = r
    return t
  }

  fun e23(q: String) = InvokeModelRequest { modelId = "anthropic.claude-3-haiku" }

  fun b24(q: String): Any {
    val r = InvokeModelWithResponseStreamRequest { modelId = "anthropic.claude-3-haiku" }
    val t = r
    return t
  }

  fun e24(q: String) = InvokeModelWithResponseStreamRequest { modelId = "anthropic.claude-3-haiku" }

  fun b25(q: String): Any {
    val r = InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build()
    val t = r
    return t
  }

  fun e25(q: String) = InvokeModelRequest.builder().modelId("anthropic.claude-3-haiku").build()

  fun b26(q: String): Any {
    val r = InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build()
    val t = r
    return t
  }

  fun e26(q: String) = InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3-haiku").build()

  private val p1 = openai.chat().completions().create(PROMPT)

  fun viaThis(): Any {
    return this.p1
  }

  fun viaThisExpr() = this.p1
}
