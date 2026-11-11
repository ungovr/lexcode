// lexcode-expect: 0
package demo.ai;

import java.util.List;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ToolController {
    private final ChatClient chatClient;
    private final ChatModel chatModel;
    private final NoteRepository notes;
    private final MailTemplates templates;

    public ToolController(ChatClient chatClient, ChatModel chatModel, NoteRepository notes, MailTemplates templates) {
        this.chatClient = chatClient;
        this.chatModel = chatModel;
        this.notes = notes;
        this.templates = templates;
    }

    // One typed question inside a fixed prompt is a one-shot tool, not a chatbot.
    @PostMapping("/summarize")
    public String summarize(@RequestBody String text) {
        return chatClient.prompt().user("Summarize in one line: " + text).call().content();
    }

    // A request object whose single field fills a fixed prompt: still one question, one answer.
    @PostMapping("/title")
    public String title(@RequestBody TitleRequest request) {
        return chatModel.call(new Prompt(new UserMessage("Suggest a title for: " + request.getBody()))).getResult()
                .getOutput().getText();
    }

    // A list of messages from the client that goes to a database and not to a model.
    @PostMapping("/notes")
    public void importNotes(@RequestBody List<NoteDto> messages) {
        notes.saveAll(messages);
    }

    // A "messages" builder that is not a model request.
    @PostMapping("/mail-preview")
    public String preview(@RequestBody List<String> messages) {
        return templates.builder().messages(messages).render();
    }
}

// A job that builds its own messages from a file and calls the model: no client conversation.
class NightlyClassifier {
    private final ChatClient chatClient;

    NightlyClassifier(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    String classify(List<org.springframework.ai.chat.messages.Message> history) {
        return chatClient.prompt().messages(history).call().content();
    }
}
