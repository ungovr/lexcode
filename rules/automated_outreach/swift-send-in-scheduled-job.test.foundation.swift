// lexcode-expect: 1
import Foundation

// The timer written with its module, `Foundation.Timer`, under `import Foundation`.
final class NewsletterClock {
    func start() {
        Foundation.Timer.scheduledTimer(withTimeInterval: 86_400, repeats: true) { _ in
            self.mailer.sendNewsletter()
        }
    }
}
