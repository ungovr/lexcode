// lexcode-expect: 0
// Pictures saved to an asset store, and a crop or thumbnail of a person's own image.
package com.example.negative.image

import kotlinx.coroutines.runBlocking
import com.openai.client.OpenAIClient
import com.openai.models.images.ImageGenerateParams
import java.awt.image.BufferedImage

interface AssetStore {
  fun put(name: String, bytes: ByteArray)
}

class Library(private val client: OpenAIClient, private val assets: AssetStore) {
  // The picture goes to the asset store; the function answers with a flag.
  fun draw(name: String, prompt: String): Boolean {
    val images = client.images().generate(ImageGenerateParams.builder().prompt(prompt).build())
    assets.put(name, java.util.Base64.getDecoder().decode(images.data().get()[0].b64Json().get()))
    return true
  }

  // A crop of a person's own image is not generated.
  fun crop(source: BufferedImage): BufferedImage = source.getSubimage(0, 0, 64, 64)

  fun thumbnail(source: BufferedImage): BufferedImage {
    val small = BufferedImage(64, 64, BufferedImage.TYPE_INT_ARGB)
    small.graphics.drawImage(source, 0, 0, 64, 64, null)
    return small
  }
}

// The last expression of a lambda is not a return of the function.
class Warmer(private val client: OpenAIClient) {
  fun warm(q: String) {
    runBlocking { client.images().generate(ImageGenerateParams.builder().prompt(q).build()) }
  }
}
