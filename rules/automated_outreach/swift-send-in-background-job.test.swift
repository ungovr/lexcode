// lexcode-expect: 2
import Vapor
import Queues

// A queued Vapor job that sends mail: it runs off a request, so the code does not show whether a
// person asked for this message.
struct FollowUpJob: AsyncJob {
    typealias Payload = FollowUp

    func dequeue(_ context: QueueContext, _ payload: FollowUp) async throws {
        try await context.application.smtp.send(Email(to: payload.address, subject: "Checking in", body: "..."))
    }
}

final class LegacyFollowUpJob: Job {
    typealias Payload = FollowUp

    func dequeue(_ context: QueueContext, _ payload: FollowUp) -> EventLoopFuture<Void> {
        mailer.sendFollowUpEmail(to: payload.address, on: context.eventLoop)
    }
}
