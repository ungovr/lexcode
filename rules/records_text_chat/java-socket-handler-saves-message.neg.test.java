// lexcode-expect: 0
package demo.socket;

import jakarta.websocket.OnMessage;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerEndpoint;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

// Socket handlers that save something other than chat text, and a message-named save outside a socket handler.
@Controller
public class LiveFeeds {
    private final PositionRepository positionRepository;
    private final MetricRepository metricRepository;
    private final ContactMessageRepository contactMessageRepository;

    public LiveFeeds(PositionRepository positionRepository, MetricRepository metricRepository,
                     ContactMessageRepository contactMessageRepository) {
        this.positionRepository = positionRepository;
        this.metricRepository = metricRepository;
        this.contactMessageRepository = contactMessageRepository;
    }

    // A vehicle position pushed over a socket.
    @MessageMapping("/positions")
    public void position(@Payload PositionUpdate update) {
        positionRepository.save(new Position(update.getVehicle(), update.getLat(), update.getLon()));
    }

    // A handler that only echoes and keeps nothing.
    @MessageMapping("/echo")
    public String echo(@Payload String text) {
        return text;
    }

    // A contact form posted over HTTP: a form the app only saves, no socket handler around it.
    @PostMapping("/contact")
    public void contact(@RequestBody ContactForm form) {
        contactMessageRepository.save(new ContactMessage(form.getEmail(), form.getBody()));
    }
}

@ServerEndpoint("/metrics")
class MetricsEndpoint {
    private MetricRepository metricRepository;

    @OnMessage
    public void onMessage(String sample, Session session) {
        metricRepository.save(new Metric(sample));
    }
}
