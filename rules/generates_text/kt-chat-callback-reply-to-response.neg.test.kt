// lexcode-expect: 0
// A streaming callback that only counts what it is given, and an onNext of another interface (an Rx-style observer)
// in a file that imports LangChain4j, whose token reaches a screen.
package com.example.negative.text

import android.widget.TextView
import dev.langchain4j.model.chat.response.StreamingChatResponseHandler
import org.slf4j.LoggerFactory

private val log = LoggerFactory.getLogger("negative")

interface Observer<T> {
  fun onNext(t: T)
}

class Screen(private val view: TextView) {
  // onNext(t: String) of an Observer is not a LangChain4j token.
  fun observer() = object : Observer<String> {
    override fun onNext(t: String) {
      view.text = t
    }
  }

  // The LangChain4j handler here only counts.
  fun counter(): StreamingChatResponseHandler {
    var tokens = 0
    return object : StreamingChatResponseHandler {
      override fun onPartialResponse(partialResponse: String) {
        tokens += 1
      }

      override fun onCompleteResponse(response: dev.langchain4j.model.chat.response.ChatResponse) {
        log.info("{} tokens", tokens)
      }

      override fun onError(error: Throwable) {}
    }
  }
}
