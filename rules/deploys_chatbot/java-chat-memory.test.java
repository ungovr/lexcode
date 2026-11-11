// lexcode-expect: 7
package demo.ai;

import com.google.cloud.vertexai.generativeai.GenerativeModel;
import dev.langchain4j.memory.chat.MessageWindowChatMemory;
import dev.langchain4j.memory.chat.TokenWindowChatMemory;
import dev.langchain4j.service.AiServices;
import org.springframework.ai.chat.client.advisor.MessageChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.PromptChatMemoryAdvisor;
import org.springframework.ai.chat.client.advisor.vectorstore.VectorStoreChatMemoryAdvisor;

// Code that keeps the earlier turns of a conversation with a language model, so the next answer
// follows the last one; the code does not show who the conversation is with.
public class Remembering {
    interface Assistant {
        String chat(String message);
    }

    Assistant windowed(dev.langchain4j.model.chat.ChatLanguageModel model) {
        return AiServices.builder(Assistant.class)
                .chatLanguageModel(model)
                .chatMemory(MessageWindowChatMemory.withMaxMessages(20))
                .build();
    }

    Assistant perUser(dev.langchain4j.model.chat.ChatLanguageModel model) {
        return AiServices.builder(Assistant.class)
                .chatLanguageModel(model)
                .chatMemoryProvider(id -> new CustomMemory(id))
                .build();
    }

    Object standalone() {
        return TokenWindowChatMemory.withMaxTokens(1000, null);
    }

    Object springAdvisors(org.springframework.ai.chat.client.ChatClient.Builder builder,
                          org.springframework.ai.chat.memory.ChatMemory memory) {
        builder.defaultAdvisors(MessageChatMemoryAdvisor.builder(memory).build());
        builder.defaultAdvisors(PromptChatMemoryAdvisor.builder(memory).build());
        builder.defaultAdvisors(VectorStoreChatMemoryAdvisor.builder(null).build());
        return builder.build();
    }

    Object geminiSession(GenerativeModel model) throws Exception {
        var chat = model.startChat();
        return chat.sendMessage("Hello");
    }
}
