// lexcode-expect: 0
import Vapor
import Queues

// Scheduled work that sends nothing to people, a one-off timer, a retry loop that sleeps between
// attempts at ONE message, and a periodic post to the bot's own channel.
struct CleanupJob: AsyncScheduledJob {
    func run(context: QueueContext) async throws {
        try await Session.query(on: context.application.db).filter(\.$expired == true).delete()
    }
}

final class Checker {
    func debounce() {
        Timer.scheduledTimer(withTimeInterval: 0.5, repeats: false) { _ in
            self.mailer.sendReceiptEmail()
        }
    }

    func deliver(_ receipt: Receipt) async throws {
        var attempt = 0
        while attempt < 3 {
            attempt += 1
            try await mailer.sendReceiptEmail(receipt)
            try await Task.sleep(for: .seconds(attempt))
        }
    }

    func poll() async throws {
        while !Task.isCancelled {
            await discordService.sendMessage(channelId: releasesChannel, payload: .init(content: "New release"))
            try await Task.sleep(for: .seconds(60 * 15))
        }
    }
}
