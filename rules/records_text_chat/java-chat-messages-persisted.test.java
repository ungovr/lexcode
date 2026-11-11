// lexcode-expect: 7
package demo.chat;

import java.util.List;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// What people typed in a chat, written to a table.
@RestController
public class ChatController {
    private final ChatMessageRepository chatMessageRepository;
    private final ConversationRepository conversationRepository;
    private final TranscriptDao transcriptDao;
    private final MessageStore store;
    private final javax.persistence.EntityManager entityManager;

    public ChatController(ChatMessageRepository chatMessageRepository, ConversationRepository conversationRepository,
                          TranscriptDao transcriptDao, MessageStore store, javax.persistence.EntityManager entityManager) {
        this.chatMessageRepository = chatMessageRepository;
        this.conversationRepository = conversationRepository;
        this.transcriptDao = transcriptDao;
        this.store = store;
        this.entityManager = entityManager;
    }

    @PostMapping("/chat/send")
    public void send(@RequestBody ChatPost post) {
        chatMessageRepository.save(new ChatMessage(post.getRoom(), post.getUser(), post.getText()));
    }

    @PostMapping("/chat/import")
    public void importAll(@RequestBody List<ChatMessage> messages) {
        conversationRepository.saveAll(messages);
    }

    public void archive(TranscriptEntry entry) {
        transcriptDao.insert(entry);
    }

    public void persistTurn(String room, String text) {
        entityManager.persist(new ChatTurn(room, text));
    }

    public void builderTurn(String room, String text) {
        store.save(ConversationMessage.builder().room(room).text(text).build());
    }

    public void viaOtherName(String room, String text) {
        store.saveAndFlush(new ConversationTurn(room, text));
    }

    public void direct(ChatMessage message) {
        chatMessageRepository.saveAndFlush(message);
    }
}
