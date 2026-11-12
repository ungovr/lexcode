// lexcode-expect: 12
package com.example.image

import org.springframework.scheduling.annotation.Scheduled
import android.graphics.Bitmap
import android.widget.ImageView
import aws.sdk.kotlin.services.bedrockruntime.BedrockRuntimeClient
import com.aallam.openai.api.image.ImageCreation
import com.aallam.openai.client.OpenAI
import com.azure.ai.openai.OpenAIClient as AzureOpenAIClient
import com.google.firebase.vertexai.ImagenModel
import com.google.genai.Client
import com.openai.client.OpenAIClient
import com.openai.models.images.ImageGenerateParams
import dev.langchain4j.model.image.ImageModel
import io.ktor.server.application.call
import io.ktor.server.response.respondBytes
import io.ktor.server.routing.Route
import io.ktor.server.routing.get
import jakarta.servlet.http.HttpServletResponse
import org.springframework.ai.image.ImagePrompt
import org.springframework.ai.image.ImageModel as SpringImageModel
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import javax.imageio.ImageIO

@RestController
class ImageController(
  private val openai: OpenAIClient,
  private val genai: Client,
  private val azure: AzureOpenAIClient,
  private val bedrock: BedrockRuntimeClient,
  private val imageModel: ImageModel,
  private val springImages: SpringImageModel,
) {
  // OpenAI Java SDK, the picture is the response body.
  @GetMapping("/image", produces = ["image/png"])
  fun image(@RequestParam prompt: String): ByteArray {
    val images = openai.images().generate(ImageGenerateParams.builder().prompt(prompt).build())
    return java.util.Base64.getDecoder().decode(images.data().get()[0].b64Json().get())
  }

  // Google Gen AI Imagen.
  @GetMapping("/imagen")
  fun imagen(@RequestParam prompt: String): ResponseEntity<ByteArray> {
    val generated = genai.models.generateImages("imagen-3.0-generate-002", prompt, null)
    return ResponseEntity.ok(generated.generatedImages().get()[0].image().get().imageBytes().get())
  }

  @GetMapping("/edit")
  fun edit(@RequestParam prompt: String): ByteArray = genai.models.editImage("imagen-3.0-capability-001", prompt, null, null).toString().toByteArray()

  // Azure OpenAI.
  @GetMapping("/azure")
  fun azure(@RequestParam prompt: String): String = azure.getImageGenerations("dall-e-3", null).data[0].url

  // Bedrock with an image model id, through the servlet response.
  @GetMapping("/bedrock")
  suspend fun bedrock(@RequestParam prompt: String, response: HttpServletResponse) {
    val result = bedrock.invokeModel {
      modelId = "amazon.nova-canvas-v1:0"
      body = prompt.toByteArray()
    }
    response.outputStream.write(result.body)
  }

  // LangChain4j and Spring AI image models.
  @GetMapping("/lc4j")
  fun lc4j(@RequestParam prompt: String): String = imageModel.generate(prompt).content().url().toString()

  @GetMapping("/spring")
  fun spring(@RequestParam prompt: String): String {
    val response = springImages.call(ImagePrompt(prompt))
    return response.result.output.url
  }
}

// openai-kotlin and Firebase Imagen on an Android screen.
class Painter(private val openAI: OpenAI, private val imagen: ImagenModel) {
  suspend fun paint(view: ImageView, prompt: String) {
    val images = openAI.imageURL(ImageCreation(prompt = prompt))
    view.setImageURI(android.net.Uri.parse(images.first().url))
  }

  suspend fun show(view: ImageView, prompt: String) {
    val result = imagen.generateImages(prompt)
    view.setImageBitmap(result.images.first().asBitmap())
  }
}

class ImageViewModel(private val genai: Client) {
  private val _bitmap = MutableStateFlow<Bitmap?>(null)

  fun draw(prompt: String) {
    val generated = genai.models.generateImages("imagen-3.0-generate-002", prompt, null)
    _bitmap.value = generated.generatedImages().get()[0].image().get().imageBytes().get().toBitmap()
  }
}

fun Route.imageRoutes(openAI: OpenAI) {
  get("/image") {
    val images = openAI.imageJSON(ImageCreation(prompt = "a harbor"))
    call.respondBytes(images.first().b64JSON.toByteArray())
  }
}

fun writeToResponse(openai: OpenAIClient, response: HttpServletResponse) {
  val images = openai.images().edit(com.openai.models.images.ImageEditParams.builder().build())
  ImageIO.write(images.toBufferedImage(), "png", response.outputStream)
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
