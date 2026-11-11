// lexcode-expect: 0
// Every guarded source of the group on an in-house receiver, in a file that imports no vendor. Each reaches a reply sink or a plain return, so a rule that lost its import guard would fire.
package com.example.negative.image

import android.widget.TextView
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Acme

@RestController
class H0(private val acme: Acme) {
  @GetMapping("/h0")
  fun reply(x: String): String = acme.images().generate(x)
}

class P0(private val acme: Acme) {
  fun plain(x: String): String = acme.images().generate(x)
}

@RestController
class H1(private val acme: Acme) {
  @GetMapping("/h1")
  fun reply(x: String): String = acme.images().edit(x)
}

class P1(private val acme: Acme) {
  fun plain(x: String): String = acme.images().edit(x)
}

@RestController
class H2(private val acme: Acme) {
  @GetMapping("/h2")
  fun reply(x: String): String = acme.images().createVariation(x)
}

class P2(private val acme: Acme) {
  fun plain(x: String): String = acme.images().createVariation(x)
}

@RestController
class H3(private val acme: Acme) {
  @GetMapping("/h3")
  fun reply(x: String): String = acme.imageURL(x)
}

class P3(private val acme: Acme) {
  fun plain(x: String): String = acme.imageURL(x)
}

@RestController
class H4(private val acme: Acme) {
  @GetMapping("/h4")
  fun reply(x: String): String = acme.imageJSON(x)
}

class P4(private val acme: Acme) {
  fun plain(x: String): String = acme.imageJSON(x)
}

@RestController
class H5(private val acme: Acme) {
  @GetMapping("/h5")
  fun reply(x: String): String = acme.generateImages(x)
}

class P5(private val acme: Acme) {
  fun plain(x: String): String = acme.generateImages(x)
}

@RestController
class H6(private val acme: Acme) {
  @GetMapping("/h6")
  fun reply(x: String): String = acme.getImageGenerations(x)
}

class P6(private val acme: Acme) {
  fun plain(x: String): String = acme.getImageGenerations(x)
}

@RestController
class H7(private val acme: Acme) {
  @GetMapping("/h7")
  fun reply(x: String): String = acme.getImageGenerationsWithResponse(x)
}

class P7(private val acme: Acme) {
  fun plain(x: String): String = acme.getImageGenerationsWithResponse(x)
}

@RestController
class H8(private val acme: Acme) {
  @GetMapping("/h8")
  fun reply(x: String): String = imageModel.generate(x)
}

class P8(private val acme: Acme) {
  fun plain(x: String): String = imageModel.generate(x)
}

@RestController
class H9(private val acme: Acme) {
  @GetMapping("/h9")
  fun reply(x: String): String = ImagePrompt(x)
}

class P9(private val acme: Acme) {
  fun plain(x: String): String = ImagePrompt(x)
}

@RestController
class H10(private val acme: Acme) {
  @GetMapping("/h10")
  fun reply(x: String): String = acme.invokeModel { modelId = "amazon.nova-canvas-v1:0" }
}

class P10(private val acme: Acme) {
  fun plain(x: String): String = acme.invokeModel { modelId = "amazon.nova-canvas-v1:0" }
}

@RestController
class H11(private val acme: Acme) {
  @GetMapping("/h11")
  fun reply(x: String): String = acme.invokeModelWithResponseStream { modelId = "amazon.nova-canvas-v1:0" }
}

class P11(private val acme: Acme) {
  fun plain(x: String): String = acme.invokeModelWithResponseStream { modelId = "amazon.nova-canvas-v1:0" }
}

@RestController
class H12(private val acme: Acme) {
  @GetMapping("/h12")
  fun reply(x: String): String = InvokeModelRequest { modelId = "amazon.nova-canvas-v1:0" }
}

class P12(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelRequest { modelId = "amazon.nova-canvas-v1:0" }
}

@RestController
class H13(private val acme: Acme) {
  @GetMapping("/h13")
  fun reply(x: String): String = InvokeModelRequest.builder().modelId("amazon.nova-canvas-v1:0").build()
}

class P13(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelRequest.builder().modelId("amazon.nova-canvas-v1:0").build()
}

@RestController
class H14(private val acme: Acme) {
  @GetMapping("/h14")
  fun reply(x: String): String = InvokeModelWithResponseStreamRequest { modelId = "amazon.nova-canvas-v1:0" }
}

class P14(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelWithResponseStreamRequest { modelId = "amazon.nova-canvas-v1:0" }
}

@RestController
class H15(private val acme: Acme) {
  @GetMapping("/h15")
  fun reply(x: String): String = InvokeModelWithResponseStreamRequest.builder().modelId("amazon.nova-canvas-v1:0").build()
}

class P15(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelWithResponseStreamRequest.builder().modelId("amazon.nova-canvas-v1:0").build()
}

@RestController
class H16(private val acme: Acme) {
  @GetMapping("/h16")
  fun reply(x: String): String = photos.editImage(x)
}

class P16(private val acme: Acme) {
  fun plain(x: String): String = photos.editImage(x)
}

@RestController
class H17(private val acme: Acme) {
  @GetMapping("/h17")
  fun reply(x: String): String = photos.upscaleImage(x)
}

class P17(private val acme: Acme) {
  fun plain(x: String): String = photos.upscaleImage(x)
}

@RestController
class H18(private val acme: Acme) {
  @GetMapping("/h18")
  fun reply(x: String): String = photos.models.lookup(x)
}

class P18(private val acme: Acme) {
  fun plain(x: String): String = photos.models.lookup(x)
}
