// lexcode-expect: 17
// One function per source call this rule's sinks list (#13034), in each form that reaches it:
// returned from a method, and set in a field a method returns. A sink entry that stops matching
// drops a match here.
package com.example.calls;

import com.google.cloud.vertexai.generativeai.ChatSession;
import com.google.cloud.vertexai.generativeai.GenerativeModel;
import com.google.genai.Client;

public class Calls {
  private static final String PROMPT = "Explain tides.";
  private Client client;
  private GenerativeModel gm;
  private ChatSession session;

  Object m1(String q) {
    var r = client.models.generateContent("gemini-2.5-flash", q, null);
    return r;
  }

  private final Object f1 = client.models.generateContent("gemini-2.5-flash", PROMPT, null);

  Object g1() {
    return f1;
  }

  Object m2(String q) {
    var r = client.models.generateContentStream("gemini-2.5-flash", q, null);
    return r;
  }

  private final Object f2 = client.models.generateContentStream("gemini-2.5-flash", PROMPT, null);

  Object g2() {
    return f2;
  }

  Object m3(String q) {
    var r = gm.generateContent(q);
    return r;
  }

  private final Object f3 = gm.generateContent(PROMPT);

  Object g3() {
    return f3;
  }

  Object m4(String q) {
    var r = gm.generateContentStream(q);
    return r;
  }

  private final Object f4 = gm.generateContentStream(PROMPT);

  Object g4() {
    return f4;
  }

  Object m5(String q) {
    var r = gm.generateContentAsync(q);
    return r;
  }

  private final Object f5 = gm.generateContentAsync(PROMPT);

  Object g5() {
    return f5;
  }

  Object m6(String q) {
    var r = session.sendMessage(q);
    return r;
  }

  private final Object f6 = session.sendMessage(PROMPT);

  Object g6() {
    return f6;
  }

  Object m7(String q) {
    var r = session.sendMessageStream(q);
    return r;
  }

  private final Object f7 = session.sendMessageStream(PROMPT);

  Object g7() {
    return f7;
  }

  Object m8(String q) {
    var r = client.chats.create("gemini-2.5-flash");
    return r;
  }

  private final Object f8 = client.chats.create("gemini-2.5-flash");

  Object g8() {
    return f8;
  }

  Object viaThis() {
    return this.f1;
  }
}
