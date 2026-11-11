// lexcode-expect: 0
// Image-model calls whose output stays with the team that runs them, a person's picture the app only resizes, and
// receivers that are not image models in a file that does import the vendors.
package com.example.negative.image

import kotlinx.coroutines.runBlocking
import com.google.genai.Client
import com.openai.client.OpenAIClient
import com.openai.models.images.ImageGenerateParams
import dev.langchain4j.model.image.ImageModel
import jakarta.servlet.http.HttpServletResponse
import org.slf4j.LoggerFactory
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RequestParam
import org.springframework.web.bind.annotation.RestController
import org.springframework.web.multipart.MultipartFile
import java.awt.image.BufferedImage
import java.io.File
import java.util.Base64
import javax.imageio.ImageIO

private val log = LoggerFactory.getLogger("negative")

class Resizer {
  fun generate(source: BufferedImage): BufferedImage = source
}

// bin/moodboard: a designer runs it and opens the files it writes.
fun main(client: OpenAIClient, genai: Client, model: ImageModel) {
  val images = client.images().generate(ImageGenerateParams.builder().model("gpt-image-1").prompt("A calm harbor").build())
  val png = Base64.getDecoder().decode(images.data().get()[0].b64Json().get())
  File("harbor.png").writeBytes(png)
  log.info("wrote harbor.png, {} bytes", png.size)

  val generated = genai.models.generateImages("imagen-3.0-generate-002", "A calm harbor", null)
  println(generated.generatedImages().get().size)

  val draft = model.generate("A draft").content()
  File("draft.png").writeBytes(Base64.getDecoder().decode(draft.base64Data()))
}

// A picture a person uploaded, resized and sent back. No model drew it.
@RestController
class AvatarController(private val resizer: Resizer) {
  @GetMapping("/avatar")
  fun avatar(@RequestParam name: String, response: HttpServletResponse) {
    val original = ImageIO.read(File("avatars", "$name.png"))
    val small = resizer.generate(original)
    response.contentType = "image/png"
    ImageIO.write(small, "png", response.outputStream)
  }

  @GetMapping("/upload-preview")
  fun preview(@RequestParam file: MultipartFile, response: HttpServletResponse) {
    response.outputStream.write(file.bytes)
  }
}

// The last expression of a lambda is not what the handler returns.
@RestController
class BackgroundController(private val client: OpenAIClient) {
  @GetMapping("/background")
  fun background(q: String): String {
    runBlocking { client.images().generate(ImageGenerateParams.builder().prompt(q).build()) }
    return "queued"
  }
}
