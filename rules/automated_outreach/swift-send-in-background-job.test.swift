// lexcode-expect: 5
import Vapor
import Queues
import AWSSNS
import DiscordBM

// Queued Vapor jobs that send mail, a push, a text and a Discord direct message: each runs off a
// request, so the code does not show whether a person asked for this message.
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

struct ShippedJob: Sendable, AsyncJob {
    typealias Payload = Shipment
    let sns: SNSClient
    let discord: any DiscordClient

    func dequeue(_ context: QueueContext, _ payload: Shipment) async throws {
        try await context.application.apns.send(.init(title: "Your order shipped"), to: payload.deviceToken)
        _ = try await sns.publish(input: PublishInput(message: "Your order shipped", phoneNumber: payload.phone))
        _ = try await discord.createDm(payload: .init(recipient_id: payload.member)).decode()
    }
}
