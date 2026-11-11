// lexcode-expect: 0
package demo.chat

import org.jetbrains.exposed.sql.insert
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RestController

// A form the app only saves is not a chat: contact, feedback and support-ticket records, and the
// chat room record that holds no text.
@RestController
class FormsController(
    private val contactMessageRepository: ContactMessageRepository,
    private val feedbackRepository: FeedbackRepository,
    private val ticketRepository: TicketRepository,
    private val chatRoomRepository: ChatRoomRepository,
    private val orderRepository: OrderRepository,
    private val transcriptRepository: TranscriptRepository,
    private val conversationRepository: ConversationRepository,
    private val chatRoomDao: ChatRoomDao,
    private val database: AppDatabase,
    private val entityManager: javax.persistence.EntityManager,
) {
    @PostMapping("/contact")
    fun contact(@RequestBody form: ContactForm) {
        contactMessageRepository.save(ContactMessage(form.email, form.body))
    }

    @PostMapping("/feedback")
    fun feedback(@RequestBody form: FeedbackForm) {
        feedbackRepository.save(Feedback(form.rating, form.comment))
    }

    @PostMapping("/tickets")
    fun ticket(@RequestBody form: TicketForm) {
        ticketRepository.save(SupportTicket(form.subject, form.body))
    }

    // A room record has a name and members, no text typed in a chat.
    @PostMapping("/rooms")
    fun room(@RequestBody form: RoomForm) {
        chatRoomRepository.save(ChatRoom(form.name))
        chatRoomDao.insert(ChatRoomEntity(form.name))
        database.chatRoomDao().insertAll(listOf(ChatRoomEntity(form.name)))
    }

    // An academic transcript is a student's record of courses and grades, and a bare Conversation record
    // names who talked and when; neither holds text typed in a chat.
    @PostMapping("/registrar")
    fun registrar(@RequestBody form: StudentForm) {
        transcriptRepository.save(Transcript(form.studentId))
        conversationRepository.save(Conversation(form.topic))
        entityManager.persist(TranscriptEntry(form.studentId, "MATH 101", "A"))
    }

    @PostMapping("/orders")
    fun order(@RequestBody form: OrderForm) {
        orderRepository.save(Order(form.sku))
        entityManager.persist(Order(form.sku))
    }
}

// Exposed tables that hold orders and room names, not chat text.
fun recordOrders(sku: String, name: String) {
    Orders.insert { it[Orders.sku] = sku }
    ChatRooms.insert { it[ChatRooms.name] = name }
}
