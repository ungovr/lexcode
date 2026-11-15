// lexcode-expect: 46
// One function per source call this rule's sinks list (#13034), in each form that reaches it:
// returned from a block body, as an expression body, and set in a top-level val that a function
// returns. A sink entry that stops matching drops a match here.
package com.example.calls

import de.kherud.llama.LlamaModel
import dev.langchain4j.model.chat.ChatModel
import io.github.ollama4j.OllamaAPI
import org.springframework.ai.chat.client.ChatClient

const val PROMPT = "Write a haiku."
val model: ChatModel = TODO()
val chatModel: org.springframework.ai.chat.model.ChatModel = TODO()
val chatClient: ChatClient = TODO()
val ollamaAPI: OllamaAPI = TODO()
val llamaModel: LlamaModel = TODO()

val top1 = model.chat(PROMPT)

fun fromTop1(): Any {
  return top1
}

fun exprTop1() = top1

val top2 = model.chat { userMessage(PROMPT) }

fun fromTop2(): Any {
  return top2
}

fun exprTop2() = top2

val top3 = model.generate(PROMPT)

fun fromTop3(): Any {
  return top3
}

fun exprTop3() = top3

val top4 = chatModel.call(PROMPT)

fun fromTop4(): Any {
  return top4
}

fun exprTop4() = top4

val top5 = chatModel.stream(PROMPT)

fun fromTop5(): Any {
  return top5
}

fun exprTop5() = top5

val top6 = chatClient.prompt().user(PROMPT).call()

fun fromTop6(): Any {
  return top6
}

fun exprTop6() = top6

val top7 = chatClient.prompt().user(PROMPT).stream()

fun fromTop7(): Any {
  return top7
}

fun exprTop7() = top7

val top8 = ollamaAPI.generate("llama3", PROMPT, false)

fun fromTop8(): Any {
  return top8
}

fun exprTop8() = top8

val top9 = ollamaAPI.chat("llama3", PROMPT)

fun fromTop9(): Any {
  return top9
}

fun exprTop9() = top9

val top10 = llamaModel.generate(PROMPT)

fun fromTop10(): Any {
  return top10
}

fun exprTop10() = top10

val top11 = llamaModel.complete(PROMPT)

fun fromTop11(): Any {
  return top11
}

fun exprTop11() = top11

class Calls(private val x: Int) {

  fun b1(q: String): Any {
    val r = model.chat(q)
    val t = r
    return t
  }

  fun e1(q: String) = model.chat(q)

  fun b2(q: String): Any {
    val r = model.chat { userMessage(q) }
    val t = r
    return t
  }

  fun e2(q: String) = model.chat { userMessage(q) }

  fun b3(q: String): Any {
    val r = model.generate(q)
    val t = r
    return t
  }

  fun e3(q: String) = model.generate(q)

  fun b4(q: String): Any {
    val r = chatModel.call(q)
    val t = r
    return t
  }

  fun e4(q: String) = chatModel.call(q)

  fun b5(q: String): Any {
    val r = chatModel.stream(q)
    val t = r
    return t
  }

  fun e5(q: String) = chatModel.stream(q)

  fun b6(q: String): Any {
    val r = chatClient.prompt().user(q).call()
    val t = r
    return t
  }

  fun e6(q: String) = chatClient.prompt().user(q).call()

  fun b7(q: String): Any {
    val r = chatClient.prompt().user(q).stream()
    val t = r
    return t
  }

  fun e7(q: String) = chatClient.prompt().user(q).stream()

  fun b8(q: String): Any {
    val r = ollamaAPI.generate("llama3", q, false)
    val t = r
    return t
  }

  fun e8(q: String) = ollamaAPI.generate("llama3", q, false)

  fun b9(q: String): Any {
    val r = ollamaAPI.chat("llama3", q)
    val t = r
    return t
  }

  fun e9(q: String) = ollamaAPI.chat("llama3", q)

  fun b10(q: String): Any {
    val r = llamaModel.generate(q)
    val t = r
    return t
  }

  fun e10(q: String) = llamaModel.generate(q)

  fun b11(q: String): Any {
    val r = llamaModel.complete(q)
    val t = r
    return t
  }

  fun e11(q: String) = llamaModel.complete(q)

  private val p1 = model.chat(PROMPT)

  fun viaThis(): Any {
    return this.p1
  }

  fun viaThisExpr() = this.p1
}
