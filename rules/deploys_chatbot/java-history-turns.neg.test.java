// lexcode-expect: 0
package demo.ai;

import java.util.ArrayList;
import java.util.List;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.chat.prompt.Prompt;

public class OneShotTools {
    private final ChatModel chatModel;
    private final AuditTrail audit;

    public OneShotTools(ChatModel chatModel, AuditTrail audit) {
        this.chatModel = chatModel;
        this.audit = audit;
    }

    // A prompt built in steps and sent once: a system line plus a user line, nothing pushed after the call.
    public String answerOnce(String question) {
        List<Message> messages = new ArrayList<>();
        messages.add(new SystemMessage("Answer in one sentence."));
        messages.add(new UserMessage(question));
        return chatModel.call(new Prompt(messages)).getResult().getOutput().getText();
    }

    // Few-shot examples: more user turns go in after the first call, but no model reply is stored back.
    public String classify(String a, String b) {
        List<Message> shots = new ArrayList<>();
        shots.add(new UserMessage(a));
        String first = chatModel.call(new Prompt(shots)).getResult().getOutput().getText();
        shots.add(new UserMessage(b));
        return first;
    }

    // A batch job: each document gets its own fresh list, and the answers go to a separate result list.
    public List<String> classifyAll(List<String> documents) {
        List<String> results = new ArrayList<>();
        for (String document : documents) {
            List<Message> one = new ArrayList<>();
            one.add(new UserMessage(document));
            String label = chatModel.call(new Prompt(one)).getResult().getOutput().getText();
            results.add(label);
        }
        return results;
    }

    // A list that names the current user and is rendered, not a conversation with a model: the word
    // "user" in an added value is not a user turn, and generate() here is a mail renderer.
    public void renderRecipients(User currentUser, MailRenderer mailRenderer) {
        List<String> recipients = new ArrayList<>();
        recipients.add(currentUser.getEmail());
        mailRenderer.generate(recipients);
        recipients.add("audit@example.org");
    }

    // User messages collected for the audit trail, with no model call.
    public void record(String text) {
        List<Message> trail = new ArrayList<>();
        trail.add(new UserMessage(text));
        audit.saveAll(trail);
        trail.add(new SystemMessage("recorded"));
    }
}
