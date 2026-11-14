// lexcode-expect: 41
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

  Object fe1(String q) {
    for (Object x : java.util.List.of(client.models.generateContent("gemini-2.5-flash", q, null))) {
      return x;
    }
    return null;
  }

  Object if1(String q) {
    Object r;
    if ((r = client.models.generateContent("gemini-2.5-flash", q, null)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam1 = q -> {
    var r = client.models.generateContent("gemini-2.5-flash", q, null);
    return r;
  };

  Object m2(String q) {
    var r = client.models.generateContentStream("gemini-2.5-flash", q, null);
    return r;
  }

  private final Object f2 = client.models.generateContentStream("gemini-2.5-flash", PROMPT, null);

  Object g2() {
    return f2;
  }

  Object fe2(String q) {
    for (Object x : java.util.List.of(client.models.generateContentStream("gemini-2.5-flash", q, null))) {
      return x;
    }
    return null;
  }

  Object if2(String q) {
    Object r;
    if ((r = client.models.generateContentStream("gemini-2.5-flash", q, null)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam2 = q -> {
    var r = client.models.generateContentStream("gemini-2.5-flash", q, null);
    return r;
  };

  Object m3(String q) {
    var r = gm.generateContent(q);
    return r;
  }

  private final Object f3 = gm.generateContent(PROMPT);

  Object g3() {
    return f3;
  }

  Object fe3(String q) {
    for (Object x : java.util.List.of(gm.generateContent(q))) {
      return x;
    }
    return null;
  }

  Object if3(String q) {
    Object r;
    if ((r = gm.generateContent(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam3 = q -> {
    var r = gm.generateContent(q);
    return r;
  };

  Object m4(String q) {
    var r = gm.generateContentStream(q);
    return r;
  }

  private final Object f4 = gm.generateContentStream(PROMPT);

  Object g4() {
    return f4;
  }

  Object fe4(String q) {
    for (Object x : java.util.List.of(gm.generateContentStream(q))) {
      return x;
    }
    return null;
  }

  Object if4(String q) {
    Object r;
    if ((r = gm.generateContentStream(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam4 = q -> {
    var r = gm.generateContentStream(q);
    return r;
  };

  Object m5(String q) {
    var r = gm.generateContentAsync(q);
    return r;
  }

  private final Object f5 = gm.generateContentAsync(PROMPT);

  Object g5() {
    return f5;
  }

  Object fe5(String q) {
    for (Object x : java.util.List.of(gm.generateContentAsync(q))) {
      return x;
    }
    return null;
  }

  Object if5(String q) {
    Object r;
    if ((r = gm.generateContentAsync(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam5 = q -> {
    var r = gm.generateContentAsync(q);
    return r;
  };

  Object m6(String q) {
    var r = session.sendMessage(q);
    return r;
  }

  private final Object f6 = session.sendMessage(PROMPT);

  Object g6() {
    return f6;
  }

  Object fe6(String q) {
    for (Object x : java.util.List.of(session.sendMessage(q))) {
      return x;
    }
    return null;
  }

  Object if6(String q) {
    Object r;
    if ((r = session.sendMessage(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam6 = q -> {
    var r = session.sendMessage(q);
    return r;
  };

  Object m7(String q) {
    var r = session.sendMessageStream(q);
    return r;
  }

  private final Object f7 = session.sendMessageStream(PROMPT);

  Object g7() {
    return f7;
  }

  Object fe7(String q) {
    for (Object x : java.util.List.of(session.sendMessageStream(q))) {
      return x;
    }
    return null;
  }

  Object if7(String q) {
    Object r;
    if ((r = session.sendMessageStream(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam7 = q -> {
    var r = session.sendMessageStream(q);
    return r;
  };

  Object m8(String q) {
    var r = client.chats.create("gemini-2.5-flash");
    return r;
  }

  private final Object f8 = client.chats.create("gemini-2.5-flash");

  Object g8() {
    return f8;
  }

  Object fe8(String q) {
    for (Object x : java.util.List.of(client.chats.create("gemini-2.5-flash"))) {
      return x;
    }
    return null;
  }

  Object if8(String q) {
    Object r;
    if ((r = client.chats.create("gemini-2.5-flash")) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam8 = q -> {
    var r = client.chats.create("gemini-2.5-flash");
    return r;
  };

  Object viaThis() {
    return this.f1;
  }
}
