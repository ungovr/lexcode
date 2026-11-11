// lexcode-expect: 0
// Lookalikes in a file that imports no image vendor: image-sounding methods on in-house classes, each reaching a reply
// sink, so a rule that matched the bare method name would fire.
package com.example.negative.image

import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Pixels(val bytes: ByteArray)

interface Gallery {
  fun images(): Shelf
  fun editImage(id: Long): Pixels
  fun upscaleImage(id: Long): Pixels
  fun generateImages(id: Long): Pixels
  fun imageURL(id: Long): String
  fun imageJSON(id: Long): String
  fun getImageGenerations(id: Long): String
  fun invokeModel(request: Any): Pixels
  val models: Models
}

interface Models {
  fun lookup(id: Long): Pixels
}

interface Shelf {
  fun generate(id: Long): Pixels
  fun edit(id: Long): Pixels
  fun createVariation(id: Long): Pixels
}

interface Thumbnailer {
  fun generate(id: Long): Pixels
}

class ImagePrompt(val caption: String)

@RestController
class GalleryController(private val photos: Gallery, private val thumbs: Thumbnailer) {
  @GetMapping("/photo/edit")
  fun edit(id: Long): Pixels = photos.editImage(id)

  @GetMapping("/photo/upscale")
  fun upscale(id: Long): ResponseEntity<Pixels> = ResponseEntity.ok(photos.upscaleImage(id))

  @GetMapping("/photo/generate")
  fun generate(id: Long): Pixels = photos.generateImages(id)

  @GetMapping("/photo/url")
  fun url(id: Long): String = photos.imageURL(id)

  @GetMapping("/photo/json")
  fun json(id: Long): String = photos.imageJSON(id)

  @GetMapping("/photo/generations")
  fun generations(id: Long): String = photos.getImageGenerations(id)

  @GetMapping("/photo/invoke")
  fun invoke(id: Long): Pixels = photos.invokeModel(ImagePrompt("a harbor"))

  @GetMapping("/shelf/generate")
  fun shelfGenerate(id: Long): Pixels = photos.images().generate(id)

  @GetMapping("/shelf/edit")
  fun shelfEdit(id: Long): Pixels = photos.images().edit(id)

  @GetMapping("/shelf/variation")
  fun shelfVariation(id: Long): Pixels = photos.images().createVariation(id)

  @GetMapping("/thumb")
  fun thumb(id: Long): Pixels = thumbs.generate(id)

  @GetMapping("/models")
  fun models(id: Long): Pixels = photos.models.lookup(id)

  @GetMapping("/prompt")
  fun prompt(): ImagePrompt {
    val p = ImagePrompt("a harbor")
    return p
  }
}
