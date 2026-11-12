// lexcode-expect: 0
// Methods that call a text model and keep its output, and methods that return something else.
package com.example.negative.text.returned;

import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import dev.langchain4j.model.chat.ChatModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TicketTagger {
  private static final Logger log = LoggerFactory.getLogger(TicketTagger.class);

  private final OpenAIClient openai;
  private final ChatModel model;
  private final EmbeddingModel embeddings;
  private final TicketRepository tickets;

  public TicketTagger(OpenAIClient openai, ChatModel model, EmbeddingModel embeddings, TicketRepository tickets) {
    this.openai = openai;
    this.model = model;
    this.embeddings = embeddings;
    this.tickets = tickets;
  }

  // The model's text goes to an internal table; the method returns whether it worked.
  public boolean tag(Ticket ticket) {
    String tag = model.chat("One word tag for: " + ticket.title());
    tickets.save(ticket.withTag(tag));
    return true;
  }

  // Nothing is returned.
  public void log(Ticket ticket) {
    ChatCompletion completion = openai.chat().completions().create(
        ChatCompletionCreateParams.builder().model("gpt-4o-mini").addUserMessage(ticket.body()).build());
    log.info("ticket {} summary {}", ticket.id(), completion.choices().get(0).message().content().orElse(""));
  }

  // Embeddings are numbers, and the scoring method returns a number.
  public List<Float> vectorFor(String text) {
    return embeddings.embed(text).content().vectorAsList();
  }

  public int openCount(String owner) {
    return tickets.countByOwner(owner);
  }

  // A prompt built here and a name that sounds like a model call.
  public String promptFor(Ticket ticket) {
    return "Summarize this ticket in one sentence: " + ticket.body();
  }

  public String chat(String line) {
    return line.trim();
  }
}

// An in-house suggestion service whose method names sound like model calls.
class SuggestionBox {
  private final SuggestService suggest;

  SuggestionBox(SuggestService suggest) {
    this.suggest = suggest;
  }

  public java.util.List<String> options(String prefix) {
    return suggest.getCompletions(prefix);
  }

  public Object thread(String id) {
    var t = suggest.converse(id);
    return t;
  }
}
