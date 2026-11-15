// lexcode-expect: 0
import Vapor
import Queues

// Scheduled work that sends nothing to people, a one-off timer, a retry loop that sleeps between
// attempts at ONE message, a periodic post to the bot's own channel, and an alert to the operator
// from a job's `catch` block when the job fails.
struct CleanupJob: AsyncScheduledJob {
    func run(context: QueueContext) async throws {
        do {
            try await Session.query(on: context.application.db).filter(\.$expired == true).delete()
        } catch {
            try await context.application.smtp.send(Email(to: "oncall@example.com", subject: "Cleanup failed", body: "\(error)"))
            await pager.sendAlertEmail(to: "ops@example.com", error: error)
        }
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

    func sync() async {
        while !Task.isCancelled {
            do {
                try await mirror.pull()
            } catch {
                await mailer.sendAlertEmail(to: "ops@example.com", error: error)
            }
            try? await Task.sleep(for: .seconds(60 * 5))
        }
    }
}
