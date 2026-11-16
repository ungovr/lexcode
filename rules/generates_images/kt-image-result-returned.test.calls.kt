// lexcode-expect: 70
// One function per source call this rule's sinks list (#13034), in each form that reaches it:
// returned from a block body, as an expression body, and set in a top-level val that a function
// returns. A sink entry that stops matching drops a match here.
package com.example.calls

import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import aws.sdk.kotlin.services.bedrockruntime.model.InvokeModelRequest
import aws.sdk.kotlin.services.bedrockruntime.model.InvokeModelWithResponseStreamRequest
import com.aallam.openai.client.OpenAI
import com.azure.ai.openai.OpenAIClient as AzureClient
import com.google.firebase.ai.ImagenModel
import com.google.genai.Client
import com.openai.client.OpenAIClient
import dev.langchain4j.model.image.ImageModel
import org.springframework.ai.image.ImagePrompt

const val PROMPT = "A lighthouse at dawn"
val client: OpenAIClient = TODO()
val openAI: OpenAI = TODO()
val genai: Client = TODO()
val imagen: ImagenModel = TODO()
val bedrock: BedrockRuntimeClient = TODO()
val azure: AzureClient = TODO()
val imageModel: ImageModel = TODO()
val springImages: org.springframework.ai.image.ImageModel = TODO()

val top1 = client.images().createVariation(PROMPT)

fun fromTop1(): Any {
  return top1
}

fun exprTop1() = top1

val top2 = openAI.imageURL(PROMPT)

fun fromTop2(): Any {
  return top2
}

fun exprTop2() = top2

val top3 = openAI.imageJSON(PROMPT)

fun fromTop3(): Any {
  return top3
}

fun exprTop3() = top3

val top4 = genai.models.generateImages("imagen-4.0-generate-001", PROMPT, null)

fun fromTop4(): Any {
  return top4
}

fun exprTop4() = top4

val top5 = genai.models.editImage("imagen-3.0-capability-001", PROMPT, null, null)

fun fromTop5(): Any {
  return top5
}

fun exprTop5() = top5

val top6 = genai.models.upscaleImage("imagen-4.0-upscale-preview", null, "x2", null)

fun fromTop6(): Any {
  return top6
}

fun exprTop6() = top6

val top7 = imagen.generateImages(PROMPT)

fun fromTop7(): Any {
  return top7
}

fun exprTop7() = top7

val top8 = bedrock.invokeModel { modelId = "amazon.titan-image-generator-v2:0" }

fun fromTop8(): Any {
  return top8
}

fun exprTop8() = top8

val top9 = bedrock.invokeModelWithResponseStream { modelId = "amazon.titan-image-generator-v2:0" }

fun fromTop9(): Any {
  return top9
}

fun exprTop9() = top9

val top10 = InvokeModelRequest { modelId = "amazon.titan-image-generator-v2:0" }

fun fromTop10(): Any {
  return top10
}

fun exprTop10() = top10

val top11 = InvokeModelWithResponseStreamRequest { modelId = "amazon.titan-image-generator-v2:0" }

fun fromTop11(): Any {
  return top11
}

fun exprTop11() = top11

val top12 = InvokeModelRequest.builder().modelId("amazon.titan-image-generator-v2:0").build()

fun fromTop12(): Any {
  return top12
}

fun exprTop12() = top12

val top13 = InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-image-generator-v2:0").build()

fun fromTop13(): Any {
  return top13
}

fun exprTop13() = top13

val top14 = azure.getImageGenerations("dall-e-3", PROMPT)

fun fromTop14(): Any {
  return top14
}

fun exprTop14() = top14

val top15 = azure.getImageGenerationsWithResponse("dall-e-3", PROMPT, null)

fun fromTop15(): Any {
  return top15
}

fun exprTop15() = top15

val top16 = imageModel.generate(PROMPT)

fun fromTop16(): Any {
  return top16
}

fun exprTop16() = top16

val top17 = springImages.call(ImagePrompt(PROMPT))

fun fromTop17(): Any {
  return top17
}

fun exprTop17() = top17

class Calls(private val x: Int) {

  fun b1(q: String): Any {
    val r = client.images().createVariation(q)
    val t = r
    return t
  }

  fun e1(q: String) = client.images().createVariation(q)

  fun b2(q: String): Any {
    val r = openAI.imageURL(q)
    val t = r
    return t
  }

  fun e2(q: String) = openAI.imageURL(q)

  fun b3(q: String): Any {
    val r = openAI.imageJSON(q)
    val t = r
    return t
  }

  fun e3(q: String) = openAI.imageJSON(q)

  fun b4(q: String): Any {
    val r = genai.models.generateImages("imagen-4.0-generate-001", q, null)
    val t = r
    return t
  }

  fun e4(q: String) = genai.models.generateImages("imagen-4.0-generate-001", q, null)

  fun b5(q: String): Any {
    val r = genai.models.editImage("imagen-3.0-capability-001", q, null, null)
    val t = r
    return t
  }

  fun e5(q: String) = genai.models.editImage("imagen-3.0-capability-001", q, null, null)

  fun b6(q: String): Any {
    val r = genai.models.upscaleImage("imagen-4.0-upscale-preview", null, "x2", null)
    val t = r
    return t
  }

  fun e6(q: String) = genai.models.upscaleImage("imagen-4.0-upscale-preview", null, "x2", null)

  fun b7(q: String): Any {
    val r = imagen.generateImages(q)
    val t = r
    return t
  }

  fun e7(q: String) = imagen.generateImages(q)

  fun b8(q: String): Any {
    val r = bedrock.invokeModel { modelId = "amazon.titan-image-generator-v2:0" }
    val t = r
    return t
  }

  fun e8(q: String) = bedrock.invokeModel { modelId = "amazon.titan-image-generator-v2:0" }

  fun b9(q: String): Any {
    val r = bedrock.invokeModelWithResponseStream { modelId = "amazon.titan-image-generator-v2:0" }
    val t = r
    return t
  }

  fun e9(q: String) = bedrock.invokeModelWithResponseStream { modelId = "amazon.titan-image-generator-v2:0" }

  fun b10(q: String): Any {
    val r = InvokeModelRequest { modelId = "amazon.titan-image-generator-v2:0" }
    val t = r
    return t
  }

  fun e10(q: String) = InvokeModelRequest { modelId = "amazon.titan-image-generator-v2:0" }

  fun b11(q: String): Any {
    val r = InvokeModelWithResponseStreamRequest { modelId = "amazon.titan-image-generator-v2:0" }
    val t = r
    return t
  }

  fun e11(q: String) = InvokeModelWithResponseStreamRequest { modelId = "amazon.titan-image-generator-v2:0" }

  fun b12(q: String): Any {
    val r = InvokeModelRequest.builder().modelId("amazon.titan-image-generator-v2:0").build()
    val t = r
    return t
  }

  fun e12(q: String) = InvokeModelRequest.builder().modelId("amazon.titan-image-generator-v2:0").build()

  fun b13(q: String): Any {
    val r = InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-image-generator-v2:0").build()
    val t = r
    return t
  }

  fun e13(q: String) = InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-image-generator-v2:0").build()

  fun b14(q: String): Any {
    val r = azure.getImageGenerations("dall-e-3", q)
    val t = r
    return t
  }

  fun e14(q: String) = azure.getImageGenerations("dall-e-3", q)

  fun b15(q: String): Any {
    val r = azure.getImageGenerationsWithResponse("dall-e-3", q, null)
    val t = r
    return t
  }

  fun e15(q: String) = azure.getImageGenerationsWithResponse("dall-e-3", q, null)

  fun b16(q: String): Any {
    val r = imageModel.generate(q)
    val t = r
    return t
  }

  fun e16(q: String) = imageModel.generate(q)

  fun b17(q: String): Any {
    val r = springImages.call(ImagePrompt(q))
    val t = r
    return t
  }

  fun e17(q: String) = springImages.call(ImagePrompt(q))

  private val p1 = client.images().createVariation(PROMPT)

  fun viaThis(): Any {
    return this.p1
  }

  fun viaThisExpr() = this.p1
}
