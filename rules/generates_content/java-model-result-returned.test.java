// lexcode-expect: 4
package com.example.content.returned;

import com.google.cloud.vertexai.api.GenerateContentResponse;
import com.google.cloud.vertexai.generativeai.ChatSession;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.cloud.vertexai.generativeai.ResponseHandler;
import com.google.genai.Client;
import java.io.IOException;

public class Describer {
  private final Client client;
  private final GenerativeModel vertex;
  private final ChatSession session;

  public Describer(Client client, GenerativeModel vertex, ChatSession session) {
    this.client = client;
    this.vertex = vertex;
    this.session = session;
  }

  // A service method hands the model's output, text or an image, to its caller. Where it
  // goes is not visible here, so the match is a signal.
  public String caption(String text) {
    var response = client.models.generateContent("gemini-2.5-flash", "Caption this: " + text, null);
    return response.text();
  }

  public String viaVertex(String q) throws IOException {
    GenerateContentResponse response = vertex.generateContent(q);
    return ResponseHandler.getText(response);
  }

  public GenerateContentResponse viaChat(String q) throws IOException {
    GenerateContentResponse response = session.sendMessage(q);
    return response;
  }

  public Iterable<com.google.genai.types.GenerateContentResponse> stream(String topic) {
    return client.models.generateContentStream("gemini-2.5-flash", "Tell a story about " + topic, null);
  }
}
