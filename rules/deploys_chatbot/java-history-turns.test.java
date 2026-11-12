// lexcode-expect: 5
package demo.ai;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;
import com.anthropic.client.AnthropicClient;
import com.anthropic.models.messages.MessageCreateParams;
import com.openai.client.OpenAIClient;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import dev.langchain4j.data.message.ChatMessage;
import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.model.chat.ChatLanguageModel;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;

// Each turn pushes the user's message onto a running history, sends the history to a model and
// stores the reply back in it.
public class Conversations {
    private final ChatModel chatModel;
    private final ChatLanguageModel langchain;
    private final OpenAIClient openai;
    private final AnthropicClient anthropic;

    public Conversations(ChatModel chatModel, ChatLanguageModel langchain, OpenAIClient openai, AnthropicClient anthropic) {
        this.chatModel = chatModel;
        this.langchain = langchain;
        this.openai = openai;
        this.anthropic = anthropic;
    }

    public void springAiRepl(Scanner in) {
        List<Message> history = new ArrayList<>();
        while (in.hasNextLine()) {
            history.add(new org.springframework.ai.chat.messages.UserMessage(in.nextLine()));
            var response = chatModel.call(new Prompt(history));
            history.add(response.getResult().getOutput());
        }
    }

    public void langchain4jTurn(List<ChatMessage> history, String question) {
        history.add(UserMessage.from(question));
        var reply = langchain.chat(history);
        history.add(reply.aiMessage());
    }

    public void openAiTurn(ChatCompletionCreateParams.Builder params, String question) {
        params.addUserMessage(question);
        ChatCompletion completion = openai.chat().completions().create(params.build());
        params.addMessage(completion.choices().get(0).message());
    }

    public void anthropicTurn(MessageCreateParams.Builder params, String question) {
        params.addUserMessage(question);
        var message = anthropic.messages().create(params.build());
        params.addAssistantMessage(message.content().get(0).text().get().text());
    }

    public void roleStrings(List<ChatMessage> history, String question) {
        history.add(newTurn("user", question));
        var created = openai.chat().completions().create(ChatCompletionCreateParams.builder().model("m").messages(history).build());
        history.add(newTurn("assistant", created.choices().get(0).message().content().orElse("")));
    }

    private ChatMessage newTurn(String role, String text) {
        return null;
    }
}
