// lexcode-expect: 0
import Foundation

// The app's own `AsyncJob` protocol in a file without Vapor Queues, and a queued job that resizes an
// image and sends nothing to anyone.
protocol AsyncJob {
    func dequeue() async throws
}

struct ExportJob: AsyncJob {
    func dequeue() async throws {
        try await mailer.sendExportEmail(to: "ops@example.com")
    }
}

struct ResizeJob {
    func dequeue(_ image: Data) async throws -> Data {
        image
    }
}
