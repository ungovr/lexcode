// lexcode-expect: 0
import Foundation
import Vapor

// The nearest lookalikes: a webhook's signature header, a release artifact's signature, a user
// profile's email signature, a terms-of-service acceptance flag (contract formation, left out by
// the definition), and a waiver's computed or local "signature" that is never stored.
struct WebhookPayload: Content {
    let signature: String
    let body: String
}

struct ReleaseAsset: Codable {
    let url: URL
    let signature: Data
}

struct UserProfile: Codable {
    var emailSignature: String
    var signature: String
}

struct TermsAgreement: Codable {
    var acceptedTerms: Bool
    var acceptedAt: Date
}

struct EventWaiver: Codable {
    var participantName: String
    var signature: String { participantName.uppercased() }
    static var placeholderSignature: String = "Sign here"
    static let signature = "Sign here"

    func render() -> String {
        let signature = "Signed by \(participantName)"
        return signature
    }
}

// A contractor's profile: the agreement word starts a longer word.
struct ContractorProfile: Codable {
    var signature: String
}
