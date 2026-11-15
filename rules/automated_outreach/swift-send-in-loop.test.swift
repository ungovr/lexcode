// lexcode-expect: 9
import Vapor
import APNS
import AWSSNS
import DiscordBM

// One message per recipient, sent by the software in a loop: a digest email to each subscriber, a
// push to each device, a text to each phone, a direct message to each member who asked to be pinged.
struct Notifier {
    let app: Application
    let discord: any DiscordClient
    let sns: SNSClient

    func emailSubscribers(_ subscribers: [Subscriber]) async throws {
        for subscriber in subscribers {
            try await app.smtp.send(Email(to: subscriber.email, subject: "This week", body: "..."))
        }
        for subscriber in subscribers where subscriber.optedIn {
            try await mailer.sendDigestEmail(to: subscriber.email)
        }
        for subscriber in subscribers {
            try await mailer.sendLocalizedDigestEmail(to: subscriber.email, locale: subscriber.locale)
        }
    }

    func pushDevices(_ devices: [Device]) async throws {
        for device in devices {
            try await app.apns.client.sendAlertNotification(alert(for: device), deviceToken: device.token)
        }
        devices.forEach { device in
            app.apns.send(.init(title: "New issue"), to: device.token)
        }
    }

    func textMembers(_ phones: [String]) async throws {
        for phone in phones {
            _ = try await sns.publish(input: PublishInput(message: "Sale today", phoneNumber: phone))
        }
    }

    func pingMembers(_ usersToPing: [UserSnowflake: [String]]) async throws {
        for (userId, words) in usersToPing {
            let dm = try await discord.createDm(payload: .init(recipient_id: userId)).decode()
            try await sendDM(userId: userId, payload: words)
            _ = dm
        }
    }

    func remindAll(_ users: [User]) async {
        await withTaskGroup(of: Void.self) { group in
            for user in users {
                group.addTask { await reminders.sendReminder(to: user) }
            }
        }
    }
}
