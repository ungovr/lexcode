// lexcode-expect: 0
// Every guarded source of the group on an in-house receiver, in a file that imports no vendor. Each reaches a reply sink or a plain return, so a rule that lost its import guard would fire.
package com.example.negative.text

import android.widget.TextView
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

class Acme

@RestController
class H0(private val acme: Acme) {
  @GetMapping("/h0")
  fun reply(x: String): String = acme.chat().completions().create(x)
}

class P0(private val acme: Acme) {
  fun plain(x: String): String = acme.chat().completions().create(x)
}

@RestController
class H1(private val acme: Acme) {
  @GetMapping("/h1")
  fun reply(x: String): String = acme.chat().completions().createStreaming(x)
}

class P1(private val acme: Acme) {
  fun plain(x: String): String = acme.chat().completions().createStreaming(x)
}

@RestController
class H2(private val acme: Acme) {
  @GetMapping("/h2")
  fun reply(x: String): String = client.responses().create(x)
}

class P2(private val acme: Acme) {
  fun plain(x: String): String = client.responses().create(x)
}

@RestController
class H3(private val acme: Acme) {
  @GetMapping("/h3")
  fun reply(x: String): String = openai.completions().createStreaming(x)
}

class P3(private val acme: Acme) {
  fun plain(x: String): String = openai.completions().createStreaming(x)
}

@RestController
class H4(private val acme: Acme) {
  @GetMapping("/h4")
  fun reply(x: String): String = client.messages().create(x)
}

class P4(private val acme: Acme) {
  fun plain(x: String): String = client.messages().create(x)
}

@RestController
class H5(private val acme: Acme) {
  @GetMapping("/h5")
  fun reply(x: String): String = anthropic.beta().messages().createStreaming(x)
}

class P5(private val acme: Acme) {
  fun plain(x: String): String = anthropic.beta().messages().createStreaming(x)
}

@RestController
class H6(private val acme: Acme) {
  @GetMapping("/h6")
  fun reply(x: String): String = acme.chatCompletion(x)
}

class P6(private val acme: Acme) {
  fun plain(x: String): String = acme.chatCompletion(x)
}

@RestController
class H7(private val acme: Acme) {
  @GetMapping("/h7")
  fun reply(x: String): String = acme.chatCompletions(x)
}

class P7(private val acme: Acme) {
  fun plain(x: String): String = acme.chatCompletions(x)
}

@RestController
class H8(private val acme: Acme) {
  @GetMapping("/h8")
  fun reply(x: String): String = acme.completion(x)
}

class P8(private val acme: Acme) {
  fun plain(x: String): String = acme.completion(x)
}

@RestController
class H9(private val acme: Acme) {
  @GetMapping("/h9")
  fun reply(x: String): String = acme.completions(x)
}

class P9(private val acme: Acme) {
  fun plain(x: String): String = acme.completions(x)
}

@RestController
class H10(private val acme: Acme) {
  @GetMapping("/h10")
  fun reply(x: String): String = acme.getChatCompletions(x)
}

class P10(private val acme: Acme) {
  fun plain(x: String): String = acme.getChatCompletions(x)
}

@RestController
class H11(private val acme: Acme) {
  @GetMapping("/h11")
  fun reply(x: String): String = acme.getChatCompletionsStream(x)
}

class P11(private val acme: Acme) {
  fun plain(x: String): String = acme.getChatCompletionsStream(x)
}

@RestController
class H12(private val acme: Acme) {
  @GetMapping("/h12")
  fun reply(x: String): String = acme.getCompletions(x)
}

class P12(private val acme: Acme) {
  fun plain(x: String): String = acme.getCompletions(x)
}

@RestController
class H13(private val acme: Acme) {
  @GetMapping("/h13")
  fun reply(x: String): String = inferenceClient.complete(x)
}

class P13(private val acme: Acme) {
  fun plain(x: String): String = inferenceClient.complete(x)
}

@RestController
class H14(private val acme: Acme) {
  @GetMapping("/h14")
  fun reply(x: String): String = inferenceClient.completeStream(x)
}

class P14(private val acme: Acme) {
  fun plain(x: String): String = inferenceClient.completeStream(x)
}

@RestController
class H15(private val acme: Acme) {
  @GetMapping("/h15")
  fun reply(x: String): String = acme.converse(x)
}

class P15(private val acme: Acme) {
  fun plain(x: String): String = acme.converse(x)
}

@RestController
class H16(private val acme: Acme) {
  @GetMapping("/h16")
  fun reply(x: String): String = acme.converse { x }
}

class P16(private val acme: Acme) {
  fun plain(x: String): String = acme.converse { x }
}

@RestController
class H17(private val acme: Acme) {
  @GetMapping("/h17")
  fun reply(x: String): String = acme.converseStream(x)
}

class P17(private val acme: Acme) {
  fun plain(x: String): String = acme.converseStream(x)
}

@RestController
class H18(private val acme: Acme) {
  @GetMapping("/h18")
  fun reply(x: String): String = acme.converseStream { x }
}

class P18(private val acme: Acme) {
  fun plain(x: String): String = acme.converseStream { x }
}

@RestController
class H19(private val acme: Acme) {
  @GetMapping("/h19")
  fun reply(x: String): String = acme.invokeModel { modelId = "anthropic.claude-3" }
}

class P19(private val acme: Acme) {
  fun plain(x: String): String = acme.invokeModel { modelId = "anthropic.claude-3" }
}

@RestController
class H20(private val acme: Acme) {
  @GetMapping("/h20")
  fun reply(x: String): String = acme.invokeModelWithResponseStream { modelId = "anthropic.claude-3" }
}

class P20(private val acme: Acme) {
  fun plain(x: String): String = acme.invokeModelWithResponseStream { modelId = "anthropic.claude-3" }
}

@RestController
class H21(private val acme: Acme) {
  @GetMapping("/h21")
  fun reply(x: String): String = InvokeModelRequest { modelId = "anthropic.claude-3" }
}

class P21(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelRequest { modelId = "anthropic.claude-3" }
}

@RestController
class H22(private val acme: Acme) {
  @GetMapping("/h22")
  fun reply(x: String): String = InvokeModelRequest.builder().modelId("anthropic.claude-3").build()
}

class P22(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelRequest.builder().modelId("anthropic.claude-3").build()
}

@RestController
class H23(private val acme: Acme) {
  @GetMapping("/h23")
  fun reply(x: String): String = InvokeModelWithResponseStreamRequest { modelId = "anthropic.claude-3" }
}

class P23(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelWithResponseStreamRequest { modelId = "anthropic.claude-3" }
}

@RestController
class H24(private val acme: Acme) {
  @GetMapping("/h24")
  fun reply(x: String): String = InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3").build()
}

class P24(private val acme: Acme) {
  fun plain(x: String): String = InvokeModelWithResponseStreamRequest.builder().modelId("anthropic.claude-3").build()
}

@RestController
class H25(private val acme: Acme) {
  @GetMapping("/h25")
  fun reply(x: String): String = llmModel.chat(x)
}

class P25(private val acme: Acme) {
  fun plain(x: String): String = llmModel.chat(x)
}

@RestController
class H26(private val acme: Acme) {
  @GetMapping("/h26")
  fun reply(x: String): String = llmModel.chat { x }
}

class P26(private val acme: Acme) {
  fun plain(x: String): String = llmModel.chat { x }
}

@RestController
class H27(private val acme: Acme) {
  @GetMapping("/h27")
  fun reply(x: String): String = chatModel.generate(x)
}

class P27(private val acme: Acme) {
  fun plain(x: String): String = chatModel.generate(x)
}

@RestController
class H28(private val acme: Acme) {
  @GetMapping("/h28")
  fun reply(x: String): String = chatModel.call(x)
}

class P28(private val acme: Acme) {
  fun plain(x: String): String = chatModel.call(x)
}

@RestController
class H29(private val acme: Acme) {
  @GetMapping("/h29")
  fun reply(x: String): String = llmModel.stream(x)
}

class P29(private val acme: Acme) {
  fun plain(x: String): String = llmModel.stream(x)
}

@RestController
class H30(private val acme: Acme) {
  @GetMapping("/h30")
  fun reply(x: String): String = ollamaAPI.generate(x)
}

class P30(private val acme: Acme) {
  fun plain(x: String): String = ollamaAPI.generate(x)
}

@RestController
class H31(private val acme: Acme) {
  @GetMapping("/h31")
  fun reply(x: String): String = ollamaApi.chat(x)
}

class P31(private val acme: Acme) {
  fun plain(x: String): String = ollamaApi.chat(x)
}

@RestController
class H32(private val acme: Acme) {
  @GetMapping("/h32")
  fun reply(x: String): String = llamaModel.generate(x)
}

class P32(private val acme: Acme) {
  fun plain(x: String): String = llamaModel.generate(x)
}

@RestController
class H33(private val acme: Acme) {
  @GetMapping("/h33")
  fun reply(x: String): String = model.complete(x)
}

class P33(private val acme: Acme) {
  fun plain(x: String): String = model.complete(x)
}

@RestController
class H34(private val acme: Acme) {
  @GetMapping("/h34")
  fun reply(x: String): String = acme.prompt(x).user(x).call()
}

class P34(private val acme: Acme) {
  fun plain(x: String): String = acme.prompt(x).user(x).call()
}

@RestController
class H35(private val acme: Acme) {
  @GetMapping("/h35")
  fun reply(x: String): String = acme.prompt(x).user(x).stream()
}

class P35(private val acme: Acme) {
  fun plain(x: String): String = acme.prompt(x).user(x).stream()
}

// A streaming callback of an in-house listener, with no LangChain4j import: the token reaches a screen.
class Listener(private val view: TextView) {
  fun one(acme: Acme) {
    acme.onPartialResponse { p -> view.text = p }
  }

  fun two(acme: Acme) {
    acme.onPartialResponse { view.text = it }
  }

  fun three(acme: Acme) {
    model.chat("q") { tok -> view.text = tok }
  }

  fun four() = object : TokenListener {
    override fun onPartialResponse(partial: String) {
      view.text = partial
    }
  }

  fun five() = object : StreamingResponseHandler<AiMessage> {
    override fun onNext(token: String) {
      view.text = token
    }
  }
}
