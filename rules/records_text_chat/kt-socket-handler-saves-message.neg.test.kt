// lexcode-expect: 0
package demo.socket

import io.ktor.server.routing.Route
import io.ktor.server.websocket.webSocket
import jakarta.websocket.OnMessage
import jakarta.websocket.Session
import jakarta.websocket.server.ServerEndpoint
import org.springframework.messaging.handler.annotation.MessageMapping
import org.springframework.messaging.handler.annotation.Payload
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody

// Socket handlers that save something other than chat text, and a message-named save outside a socket handler.
@Controller
class LiveFeeds(
    private val positionRepository: PositionRepository,
    private val metricRepository: MetricRepository,
    private val contactMessageRepository: ContactMessageRepository,
) {
    // A vehicle position pushed over a socket.
    @MessageMapping("/positions")
    fun position(@Payload update: PositionUpdate) {
        positionRepository.save(Position(update.vehicle, update.lat, update.lon))
    }

    // A handler that only echoes and keeps nothing.
    @MessageMapping("/echo")
    fun echo(@Payload text: String): String = text

    // A contact form posted over HTTP: a form the app only saves, no socket handler around it.
    @PostMapping("/contact")
    fun contact(@RequestBody form: ContactForm) {
        contactMessageRepository.save(ContactMessage(form.email, form.body))
    }
}

@ServerEndpoint("/metrics")
class MetricsEndpoint(private val metricRepository: MetricRepository) {
    @OnMessage
    fun onMessage(sample: String, session: Session) {
        metricRepository.save(Metric(sample))
    }
}

// Ktor: a socket route that stores positions, and a message-named write outside any socket route.
fun Route.feeds(positionStore: PositionStore, messageStore: MessageStore) {
    webSocket("/positions") {
        for (frame in incoming) {
            positionStore.save(frame)
        }
    }

    webSocket("/metrics") {
        Metrics.insert { it[value] = 1 }
    }
}

class ImportJob(private val messageStore: MessageStore) {
    fun load(rows: List<Row>) {
        rows.forEach { messageStore.save(it) }
    }
}
