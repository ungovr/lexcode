// lexcode-expect: 26
// One function per source call this rule's sinks list (#13034), in each form that reaches it:
// returned from a block body, as an expression body, and set in a top-level val that a function
// returns. A sink entry that stops matching drops a match here.
package com.example.calls

import com.google.ai.client.generativeai.GenerativeModel
import com.google.genai.Client

const val PROMPT = "Explain tides."
val client: Client = TODO()
val generativeModel: GenerativeModel = TODO()

val top1 = client.models.generateContent("gemini-2.5-flash", PROMPT, null)

fun fromTop1(): Any {
  return top1
}

fun exprTop1() = top1

val top2 = client.models.generateContentStream("gemini-2.5-flash", PROMPT, null)

fun fromTop2(): Any {
  return top2
}

fun exprTop2() = top2

val top3 = client.chats.create("gemini-2.5-flash")

fun fromTop3(): Any {
  return top3
}

fun exprTop3() = top3

val top4 = generativeModel.generateContent(PROMPT)

fun fromTop4(): Any {
  return top4
}

fun exprTop4() = top4

val top5 = generativeModel.generateContentStream(PROMPT)

fun fromTop5(): Any {
  return top5
}

fun exprTop5() = top5

val top6 = generativeModel.startChat()

fun fromTop6(): Any {
  return top6
}

fun exprTop6() = top6

class Calls(private val x: Int) {

  fun b1(q: String): Any {
    val r = client.models.generateContent("gemini-2.5-flash", q, null)
    val t = r
    return t
  }

  fun e1(q: String) = client.models.generateContent("gemini-2.5-flash", q, null)

  fun b2(q: String): Any {
    val r = client.models.generateContentStream("gemini-2.5-flash", q, null)
    val t = r
    return t
  }

  fun e2(q: String) = client.models.generateContentStream("gemini-2.5-flash", q, null)

  fun b3(q: String): Any {
    val r = client.chats.create("gemini-2.5-flash")
    val t = r
    return t
  }

  fun e3(q: String) = client.chats.create("gemini-2.5-flash")

  fun b4(q: String): Any {
    val r = generativeModel.generateContent(q)
    val t = r
    return t
  }

  fun e4(q: String) = generativeModel.generateContent(q)

  fun b5(q: String): Any {
    val r = generativeModel.generateContentStream(q)
    val t = r
    return t
  }

  fun e5(q: String) = generativeModel.generateContentStream(q)

  fun b6(q: String): Any {
    val r = generativeModel.startChat()
    val t = r
    return t
  }

  fun e6(q: String) = generativeModel.startChat()

  private val p1 = client.models.generateContent("gemini-2.5-flash", PROMPT, null)

  fun viaThis(): Any {
    return this.p1
  }

  fun viaThisExpr() = this.p1
}
