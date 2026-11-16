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

// Each line below is a name the rule reads, on an agreement type, kept out by one exclusion
// alone: the computed property, the static properties (typed and inferred), and the locals in a
// method and an initializer (typed and inferred).
struct EventWaiver: Codable {
    var participantName: String
    var signature: String { participantName.uppercased() }
    static var customerSignature: String = "Sign here"
    static let guardianSignature = "Sign here"

    init(participantName: String) {
        let drawnSignature: String = participantName.lowercased()
        var signatureData = Data(drawnSignature.utf8)
        signatureData.removeAll()
        self.participantName = participantName
    }

    func render() -> String {
        let witnessSignature: String = "Signed by \(participantName)"
        let signatureImage = witnessSignature.uppercased()
        return signatureImage
    }
}

// A contractor's profile: the agreement word starts a longer word.
struct ContractorProfile: Codable {
    var signature: String
}
