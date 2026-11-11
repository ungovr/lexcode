// lexcode-expect: 6
package com.example.image

import org.springframework.scheduling.annotation.Scheduled
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.bind.annotation.GetMapping
import com.aallam.openai.api.image.ImageCreation
import com.aallam.openai.client.OpenAI
import com.google.genai.Client
import com.openai.client.OpenAIClient
import com.openai.models.images.ImageGenerateParams
import dev.langchain4j.model.image.ImageModel

// Functions that hand a drawn picture to whoever calls them, outside any request handler.
class Studio(
  private val openai: OpenAIClient,
  private val genai: Client,
  private val openAI: OpenAI,
  private val imageModel: ImageModel,
) {
  fun draw(prompt: String): ByteArray {
    val images = openai.images().generate(ImageGenerateParams.builder().prompt(prompt).build())
    return java.util.Base64.getDecoder().decode(images.data().get()[0].b64Json().get())
  }

  fun imagen(prompt: String): String = genai.models.generateImages("imagen-3.0-generate-002", prompt, null).toString()

  suspend fun paint(prompt: String): String {
    val images = openAI.imageURL(ImageCreation(prompt = prompt))
    return images.first().url
  }

  fun sketch(prompt: String) = imageModel.generate(prompt).content().url().toString()
}

// A mapped handler that returns model output is the reply rule's, so this rule counts it zero times.
@RestController
class Handler(private val openai: OpenAIClient) {
  @GetMapping("/direct")
  fun direct(q: String): String = openai.images().generate(ImageGenerateParams.builder().prompt(q).build()).toString()

  @GetMapping("/direct2")
  fun direct2(q: String): String {
    val answer = openai.images().generate(ImageGenerateParams.builder().prompt(q).build()).toString()
    return answer
  }
}

// A function that is not a request handler: a scheduled job returns the model's output to its scheduler.
class Refresher(private val openai: OpenAIClient) {
  @Scheduled(fixedRate = 60000)
  fun refresh(): String {
    return openai.images().generate(ImageGenerateParams.builder().build()).toString()
  }

  @Scheduled(fixedRate = 120000)
  fun again(): String = openai.images().generate(ImageGenerateParams.builder().build()).toString()
}
