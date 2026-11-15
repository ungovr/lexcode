// lexcode-expect: 0
import Vapor
import UserNotifications
import APNS

// Loops that send ONE message to ONE person, or that send nothing to people: retries over attempts,
// a fallback over mail relays, local notifications the app schedules on the person's own device,
// silent background pushes that only refresh data, and the bot posting to its own channels.
struct Sender {
    let app: Application

    func sendReceipt(_ receipt: Receipt) async throws {
        for attempt in 1...3 {
            do {
                try await app.smtp.send(receipt.email)
                return
            } catch {
                try await Task.sleep(for: .seconds(attempt))
            }
        }
        for relay in relayHosts {
            try await mailer.sendEmail(receipt.email, via: relay)
        }
    }

    func scheduleReminders(_ days: [Date]) async throws {
        let center = UNUserNotificationCenter.current()
        for day in days {
            let content = UNMutableNotificationContent()
            content.body = "Time to read"
            let trigger = UNCalendarNotificationTrigger(dateMatching: Calendar.current.dateComponents([.hour], from: day), repeats: false)
            try await center.add(UNNotificationRequest(identifier: day.description, content: content, trigger: trigger))
            scheduler.sendLocalNotification(content)
        }
    }

    func refresh(_ devices: [Device]) async throws {
        for device in devices {
            try await app.apns.client.sendBackgroundNotification(refresh, deviceToken: device.token)
        }
    }

    func announce(_ channels: [ChannelSnowflake]) async {
        for channel in channels {
            await discordService.sendMessage(channelId: channel, payload: .init(content: "New release"))
        }
    }
}
