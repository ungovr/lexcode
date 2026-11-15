// lexcode-expect: 5
import Vapor
import Queues

// Messages sent on a schedule that no person's action starts: a Vapor Queues scheduled job, a
// repeating Foundation timer, and a long-running task that wakes up every few minutes.
struct WeeklyDigestJob: AsyncScheduledJob {
    func run(context: QueueContext) async throws {
        try await context.application.smtp.send(Email(to: "list@example.com", subject: "Weekly", body: "..."))
    }
}

final class LegacyDigestJob: ScheduledJob {
    func run(context: QueueContext) -> EventLoopFuture<Void> {
        mailer.sendNewsletter(on: context.eventLoop)
    }
}

final class ReminderService {
    func start() {
        Timer.scheduledTimer(withTimeInterval: 3600, repeats: true) { _ in
            self.mailer.sendReminderEmails()
        }
    }

    func run() async throws {
        while !Task.isCancelled {
            try await mailer.sendDigest(to: subscribers)
            try await Task.sleep(for: .seconds(60 * 60))
        }
    }

    func runQuietly() async {
        while true {
            if (try? await Task.sleep(for: .seconds(60 * 15))) != nil {
                await notifier.sendPushNotification(to: followers)
            }
        }
    }
}
