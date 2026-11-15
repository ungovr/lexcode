// lexcode-expect: 0
import Vapor
import APNS
import AWSSNS
import UserNotifications

// Sends that are not outreach: a one-time sign-in code by text (left out by its words), a publish to
// an SNS topic with no phone number, a silent background push, a local notification on the person's
// own device, and Twilio's Verify service (a verification, not a message the app composes).
struct Security {
    let app: Application
    let sns: SNSClient

    func sendCode(_ phone: String, code: String) async throws {
        _ = try await sns.publish(input: PublishInput(message: "Your verification code is \(code)", phoneNumber: phone))
        _ = try await sns.publish(input: PublishInput(message: "order.created", topicArn: "arn:aws:sns:us-east-1:1:orders"))
    }

    func refresh(_ token: String) async throws {
        try await app.apns.client.sendBackgroundNotification(APNSBackgroundNotification(expiration: .immediately, topic: "com.example", payload: Empty()), deviceToken: token)
    }

    func remindLocally() async throws {
        let content = UNMutableNotificationContent()
        content.body = "Your timer is done"
        try await UNUserNotificationCenter.current().add(UNNotificationRequest(identifier: "timer", content: content, trigger: nil))
    }

    func verifyURL(service: String) -> String {
        "https://verify.twilio.com/v2/Services/\(service)/Verifications"
    }
}
