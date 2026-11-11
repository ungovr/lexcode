// lexcode-expect: 0
// Methods that call Gemini and keep the output, methods that return something else, and a name that sounds like a model call.
package com.example.negative.content.returned;

import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.genai.Client;
import dev.langchain4j.service.AiServices;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ReleaseNotes {
  private static final Logger log = LoggerFactory.getLogger(ReleaseNotes.class);

  private final Client client;
  private final GenerativeModel vertex;
  private final NoteRepository notes;

  public ReleaseNotes(Client client, GenerativeModel vertex, NoteRepository notes) {
    this.client = client;
    this.vertex = vertex;
    this.notes = notes;
  }

  // The draft goes to an internal table; the method reports whether it worked.
  public boolean draft(String changelog) {
    var response = client.models.generateContent("gemini-2.5-flash", "Draft release notes for: " + changelog, null);
    notes.save(response.text());
    return true;
  }

  public void audit(String changelog) throws Exception {
    var response = vertex.generateContent("List risky changes in: " + changelog);
    log.info("audit {}", response.getCandidatesCount());
  }

  // A factory returns the service, not anything it wrote.
  public Triage triage(dev.langchain4j.model.chat.ChatModel model) {
    return AiServices.create(Triage.class, model);
  }

  // Retrieval and a name that sounds like a model call.
  public List<String> recent(int count) {
    return notes.latest(count);
  }

  public String generateContent(String slug) {
    return notes.render(slug);
  }

  public interface Triage {
    String category(String ticket);
  }
}
