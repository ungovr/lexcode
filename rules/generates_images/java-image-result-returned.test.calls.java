// lexcode-expect: 56
// One function per source call this rule's sinks list (#13034), in each form that reaches it:
// returned from a method, and set in a field a method returns. A sink entry that stops matching
// drops a match here.
package com.example.calls;

import com.google.genai.Client;
import com.openai.client.OpenAIClient;
import com.openai.models.images.ImageGenerateParams;
import dev.langchain4j.model.image.ImageModel;
import org.springframework.ai.image.ImagePrompt;
import software.amazon.awssdk.services.bedrockruntime.BedrockRuntimeClient;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelRequest;
import software.amazon.awssdk.services.bedrockruntime.model.InvokeModelWithResponseStreamRequest;

public class Calls {
  private static final String PROMPT = "A lighthouse at dawn";
  private OpenAIClient openai;
  private Client genai;
  private ImageModel imageModel;
  private BedrockRuntimeClient bedrock;
  private ImageGenerateParams imageParams;

  Object m1(String q) {
    var r = openai.images().createVariation(imageParams);
    return r;
  }

  private final Object f1 = openai.images().createVariation(imageParams);

  Object g1() {
    return f1;
  }

  Object fe1(String q) {
    for (Object x : java.util.List.of(openai.images().createVariation(imageParams))) {
      return x;
    }
    return null;
  }

  Object if1(String q) {
    Object r;
    if ((r = openai.images().createVariation(imageParams)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam1 = q -> {
    var r = openai.images().createVariation(imageParams);
    return r;
  };

  Object m2(String q) {
    var r = genai.models.generateImages("imagen-4.0-generate-001", q, null);
    return r;
  }

  private final Object f2 = genai.models.generateImages("imagen-4.0-generate-001", PROMPT, null);

  Object g2() {
    return f2;
  }

  Object fe2(String q) {
    for (Object x : java.util.List.of(genai.models.generateImages("imagen-4.0-generate-001", q, null))) {
      return x;
    }
    return null;
  }

  Object if2(String q) {
    Object r;
    if ((r = genai.models.generateImages("imagen-4.0-generate-001", q, null)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam2 = q -> {
    var r = genai.models.generateImages("imagen-4.0-generate-001", q, null);
    return r;
  };

  Object m3(String q) {
    var r = genai.models.editImage("imagen-3.0-capability-001", q, null, null);
    return r;
  }

  private final Object f3 = genai.models.editImage("imagen-3.0-capability-001", PROMPT, null, null);

  Object g3() {
    return f3;
  }

  Object fe3(String q) {
    for (Object x : java.util.List.of(genai.models.editImage("imagen-3.0-capability-001", q, null, null))) {
      return x;
    }
    return null;
  }

  Object if3(String q) {
    Object r;
    if ((r = genai.models.editImage("imagen-3.0-capability-001", q, null, null)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam3 = q -> {
    var r = genai.models.editImage("imagen-3.0-capability-001", q, null, null);
    return r;
  };

  Object m4(String q) {
    var r = genai.models.upscaleImage("imagen-4.0-upscale-preview", null, "x2", null);
    return r;
  }

  private final Object f4 = genai.models.upscaleImage("imagen-4.0-upscale-preview", null, "x2", null);

  Object g4() {
    return f4;
  }

  Object fe4(String q) {
    for (Object x : java.util.List.of(genai.models.upscaleImage("imagen-4.0-upscale-preview", null, "x2", null))) {
      return x;
    }
    return null;
  }

  Object if4(String q) {
    Object r;
    if ((r = genai.models.upscaleImage("imagen-4.0-upscale-preview", null, "x2", null)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam4 = q -> {
    var r = genai.models.upscaleImage("imagen-4.0-upscale-preview", null, "x2", null);
    return r;
  };

  Object m5(String q) {
    var r = bedrock.invokeModel(InvokeModelRequest.builder().modelId("amazon.titan-image-generator-v2:0").build());
    return r;
  }

  private final Object f5 = bedrock.invokeModel(InvokeModelRequest.builder().modelId("amazon.titan-image-generator-v2:0").build());

  Object g5() {
    return f5;
  }

  Object fe5(String q) {
    for (Object x : java.util.List.of(bedrock.invokeModel(InvokeModelRequest.builder().modelId("amazon.titan-image-generator-v2:0").build()))) {
      return x;
    }
    return null;
  }

  Object if5(String q) {
    Object r;
    if ((r = bedrock.invokeModel(InvokeModelRequest.builder().modelId("amazon.titan-image-generator-v2:0").build())) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam5 = q -> {
    var r = bedrock.invokeModel(InvokeModelRequest.builder().modelId("amazon.titan-image-generator-v2:0").build());
    return r;
  };

  Object m6(String q) {
    var r = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-image-generator-v2:0").build());
    return r;
  }

  private final Object f6 = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-image-generator-v2:0").build());

  Object g6() {
    return f6;
  }

  Object fe6(String q) {
    for (Object x : java.util.List.of(bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-image-generator-v2:0").build()))) {
      return x;
    }
    return null;
  }

  Object if6(String q) {
    Object r;
    if ((r = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-image-generator-v2:0").build())) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam6 = q -> {
    var r = bedrock.invokeModelWithResponseStream(InvokeModelWithResponseStreamRequest.builder().modelId("amazon.titan-image-generator-v2:0").build());
    return r;
  };

  Object m7(String q) {
    var r = imageModel.generate(q);
    return r;
  }

  private final Object f7 = imageModel.generate(PROMPT);

  Object g7() {
    return f7;
  }

  Object fe7(String q) {
    for (Object x : java.util.List.of(imageModel.generate(q))) {
      return x;
    }
    return null;
  }

  Object if7(String q) {
    Object r;
    if ((r = imageModel.generate(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam7 = q -> {
    var r = imageModel.generate(q);
    return r;
  };

  Object m8(String q) {
    var r = imageModel.edit(q);
    return r;
  }

  private final Object f8 = imageModel.edit(PROMPT);

  Object g8() {
    return f8;
  }

  Object fe8(String q) {
    for (Object x : java.util.List.of(imageModel.edit(q))) {
      return x;
    }
    return null;
  }

  Object if8(String q) {
    Object r;
    if ((r = imageModel.edit(q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam8 = q -> {
    var r = imageModel.edit(q);
    return r;
  };

  Object m9(String q) {
    var r = imageModel.call(new ImagePrompt(q));
    return r;
  }

  private final Object f9 = imageModel.call(new ImagePrompt(PROMPT));

  Object g9() {
    return f9;
  }

  Object fe9(String q) {
    for (Object x : java.util.List.of(imageModel.call(new ImagePrompt(q)))) {
      return x;
    }
    return null;
  }

  Object if9(String q) {
    Object r;
    if ((r = imageModel.call(new ImagePrompt(q))) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam9 = q -> {
    var r = imageModel.call(new ImagePrompt(q));
    return r;
  };

  Object m10(String q) {
    var r = imageModel.getImageGenerations("dall-e-3", q);
    return r;
  }

  private final Object f10 = imageModel.getImageGenerations("dall-e-3", PROMPT);

  Object g10() {
    return f10;
  }

  Object fe10(String q) {
    for (Object x : java.util.List.of(imageModel.getImageGenerations("dall-e-3", q))) {
      return x;
    }
    return null;
  }

  Object if10(String q) {
    Object r;
    if ((r = imageModel.getImageGenerations("dall-e-3", q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam10 = q -> {
    var r = imageModel.getImageGenerations("dall-e-3", q);
    return r;
  };

  Object m11(String q) {
    var r = imageModel.getImageGenerationsWithResponse("dall-e-3", q);
    return r;
  }

  private final Object f11 = imageModel.getImageGenerationsWithResponse("dall-e-3", PROMPT);

  Object g11() {
    return f11;
  }

  Object fe11(String q) {
    for (Object x : java.util.List.of(imageModel.getImageGenerationsWithResponse("dall-e-3", q))) {
      return x;
    }
    return null;
  }

  Object if11(String q) {
    Object r;
    if ((r = imageModel.getImageGenerationsWithResponse("dall-e-3", q)) != null) {
      return r;
    }
    return null;
  }

  private final java.util.function.Function<String, Object> lam11 = q -> {
    var r = imageModel.getImageGenerationsWithResponse("dall-e-3", q);
    return r;
  };

  Object viaThis() {
    return this.f1;
  }
}
