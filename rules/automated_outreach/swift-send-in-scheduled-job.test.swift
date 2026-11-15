// lexcode-expect: 9
import Vapor
import Queues
import AWSSNS
import DiscordBM

// Messages sent on a schedule that no person's action starts: a Vapor Queues scheduled job, a
// repeating Foundation timer, and a long-running task that wakes up every few minutes. The send set:
// mail, a push through Vapor APNs, an SNS text and a Discord direct message.
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

struct WeeklyPushJob: Sendable, AsyncScheduledJob {
    let tokens: [String]

    func run(context: QueueContext) async throws {
        for token in tokens {
            try await context.application.apns.send(.init(title: "Your weekly summary"), to: token)
        }
    }
}

final class ReminderService {
    let sns: SNSClient
    let discord: any DiscordClient

    init(sns: SNSClient, discord: any DiscordClient) {
        self.sns = sns
        self.discord = discord
    }

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

    func textDaily(_ phone: String) async throws {
        while !Task.isCancelled {
            _ = try await sns.publish(input: PublishInput(message: "Doors open at 7", phoneNumber: phone))
            try await Task.sleep(for: .seconds(60 * 60 * 24))
        }
    }

    func nudgeMembers(_ member: UserSnowflake) async throws {
        while !Task.isCancelled {
            _ = try await discord.createDm(payload: .init(recipient_id: member)).decode()
            try await Task.sleep(for: .seconds(60 * 60 * 6))
        }
    }

    func runGuarded() async {
        while !Task.isCancelled {
            do {
                try await mailer.sendDigest(to: subscribers)
            } catch {
                logger.error("digest failed: \(error)")
            }
            try? await Task.sleep(for: .seconds(60 * 60))
        }
    }
}
