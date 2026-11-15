// lexcode-expect: 1
import UIKit
import Persona

// Persona's earlier iOS SDK (module Persona, before Persona2).
final class LegacyVerifyViewController: UIViewController, InquiryDelegate {
    func start() async throws {
        try await Inquiry(config: InquiryConfiguration(templateId: "tmpl_123"), delegate: self).start(from: self)
    }

    func inquirySuccess(inquiryId: String, attributes: Attributes, relationships: Relationships) {}
    func inquiryCancelled() {}
    func inquiryFailed(inquiryId: String, attributes: Attributes, relationships: Relationships) {}
    func inquiryError(_ error: Error) {}
}
