// lexcode-expect: 0
// Every guarded source of the group on an in-house receiver, in a file that imports no vendor. Each reaches a reply sink or a plain return, so a rule that lost its import guard would fire.
package com.example.negative.video

import android.widget.TextView
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Acme

@RestController
class H0(private val acme: Acme) {
  @GetMapping("/h0")
  fun reply(x: String): String = acme.generateVideos(x)
}

@RestController
class H1(private val acme: Acme) {
  @GetMapping("/h1")
  fun reply(x: String): String = catalog.models.generateVideos(x)
}

@RestController
class H2(private val acme: Acme) {
  @GetMapping("/h2")
  fun reply(x: String): String = acme.videos().create(x)
}

@RestController
class H3(private val acme: Acme) {
  @GetMapping("/h3")
  fun reply(x: String): String = acme.videos().createAndPoll(x)
}

@RestController
class H4(private val acme: Acme) {
  @GetMapping("/h4")
  fun reply(x: String): String = acme.videos().remix(x)
}

@RestController
class H5(private val acme: Acme) {
  @GetMapping("/h5")
  fun reply(x: String): String = acme.videos().downloadContent(x)
}

@RestController
class H6(private val acme: Acme) {
  @GetMapping("/h6")
  fun reply(x: String): String = acme.startAsyncInvoke { modelId = "amazon.nova-reel-v1:0" }
}

@RestController
class H7(private val acme: Acme) {
  @GetMapping("/h7")
  fun reply(x: String): String = StartAsyncInvokeRequest { modelId = "amazon.nova-reel-v1:0" }
}

@RestController
class H8(private val acme: Acme) {
  @GetMapping("/h8")
  fun reply(x: String): String = StartAsyncInvokeRequest.builder().modelId("amazon.nova-reel-v1:0").build()
}
