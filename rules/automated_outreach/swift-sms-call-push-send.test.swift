// lexcode-expect: 7
import Vapor
import APNS
import AWSSNS
import SotoSNS
import DiscordBM

// A text, a call, a push or a direct message sent from a server, where the code does not show
// whether the person just asked for it.
struct Messenger {
    let app: Application
    let sns: SNSClient
    let soto: SNS
    let discord: any DiscordClient

    func push(_ token: String) async throws {
        try await app.apns.client.sendAlertNotification(
            APNSAlertNotification(alert: .init(title: .raw("Your order shipped")), expiration: .immediately, priority: .immediately, topic: "com.example.shop", payload: Empty()),
            deviceToken: token
        )
        try await app.apns.send(.init(title: "Back in stock"), to: token)
    }

    func text(_ phone: String) async throws {
        _ = try await sns.publish(input: PublishInput(message: "Your table is ready", phoneNumber: phone))
        _ = try await soto.publish(.init(message: "Doors open at 7", phoneNumber: phone))
    }

    func twilioMessagesURL(account: String) -> String {
        "https://api.twilio.com/2010-04-01/Accounts/\(account)/Messages.json"
    }

    func twilioCallsURL(account: String) -> String {
        "https://api.twilio.com/2010-04-01/Accounts/\(account)/Calls.json"
    }

    func directMessage(_ user: UserSnowflake) async throws {
        _ = try await discord.createDm(payload: .init(recipient_id: user)).decode()
    }
}
