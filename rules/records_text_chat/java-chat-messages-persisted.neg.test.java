// lexcode-expect: 0
package demo.chat;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

// A form the app only saves is not a chat: contact, feedback and support-ticket records, and the
// chat room record that holds no text.
@RestController
public class FormsController {
    private final ContactMessageRepository contactMessageRepository;
    private final FeedbackRepository feedbackRepository;
    private final TicketRepository ticketRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final OrderRepository orderRepository;
    private final TranscriptRepository transcriptRepository;
    private final ConversationRepository conversationRepository;
    private final javax.persistence.EntityManager entityManager;

    public FormsController(ContactMessageRepository contactMessageRepository, FeedbackRepository feedbackRepository,
                           TicketRepository ticketRepository, ChatRoomRepository chatRoomRepository,
                           OrderRepository orderRepository, TranscriptRepository transcriptRepository,
                           ConversationRepository conversationRepository, javax.persistence.EntityManager entityManager) {
        this.transcriptRepository = transcriptRepository;
        this.conversationRepository = conversationRepository;
        this.contactMessageRepository = contactMessageRepository;
        this.feedbackRepository = feedbackRepository;
        this.ticketRepository = ticketRepository;
        this.chatRoomRepository = chatRoomRepository;
        this.orderRepository = orderRepository;
        this.entityManager = entityManager;
    }

    @PostMapping("/contact")
    public void contact(@RequestBody ContactForm form) {
        contactMessageRepository.save(new ContactMessage(form.getEmail(), form.getBody()));
    }

    @PostMapping("/feedback")
    public void feedback(@RequestBody FeedbackForm form) {
        feedbackRepository.save(new Feedback(form.getRating(), form.getComment()));
    }

    @PostMapping("/tickets")
    public void ticket(@RequestBody TicketForm form) {
        ticketRepository.save(new SupportTicket(form.getSubject(), form.getBody()));
    }

    // A room record has a name and members, no text typed in a chat.
    @PostMapping("/rooms")
    public void room(@RequestBody RoomForm form) {
        chatRoomRepository.save(new ChatRoom(form.getName()));
    }

    // An academic transcript is a student's record of courses and grades, and a bare Conversation record
    // names who talked and when; neither holds text typed in a chat.
    @PostMapping("/registrar")
    public void registrar(@RequestBody StudentForm form) {
        transcriptRepository.save(new Transcript(form.getStudentId()));
        conversationRepository.save(new Conversation(form.getTopic()));
        entityManager.persist(new TranscriptEntry(form.getStudentId(), "MATH 101", "A"));
    }

    @PostMapping("/orders")
    public void order(@RequestBody OrderForm form) {
        orderRepository.save(new Order(form.getSku()));
        entityManager.persist(new Order(form.getSku()));
    }
}
