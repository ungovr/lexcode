// lexcode-expect: 0
// Every guarded source of the group on an in-house receiver, in a file that imports no vendor. Each reaches a reply sink or a plain return, so a rule that lost its import guard would fire.
package com.example.negative.content

import android.widget.TextView
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Acme

@RestController
class H0(private val acme: Acme) {
  @GetMapping("/h0")
  fun reply(x: String): String = acme.generateContent(x)
}

class P0(private val acme: Acme) {
  fun plain(x: String): String = acme.generateContent(x)
}

@RestController
class H1(private val acme: Acme) {
  @GetMapping("/h1")
  fun reply(x: String): String = acme.generateContentStream(x)
}

class P1(private val acme: Acme) {
  fun plain(x: String): String = acme.generateContentStream(x)
}

@RestController
class H2(private val acme: Acme) {
  @GetMapping("/h2")
  fun reply(x: String): String = acme.startChat(x)
}

class P2(private val acme: Acme) {
  fun plain(x: String): String = acme.startChat(x)
}
