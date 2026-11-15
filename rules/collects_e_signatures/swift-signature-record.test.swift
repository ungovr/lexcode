// lexcode-expect: 7
import Foundation
import SwiftData

// Records of an agreement, waiver or consent that keep the signature a person gave.
struct LeaseAgreement: Codable {
    let tenantName: String
    let signatureImage: Data
    let signedAt: Date
}

final class ParentalConsentForm: Codable {
    var childName: String = ""
    var guardianSignature: String = ""
    var signedAt: Date?
}

@Model
final class LiabilityWaiver {
    var participant: String
    var signature: Data?

    init(participant: String, signature: Data?) {
        self.participant = participant
        self.signature = signature
    }
}

struct WorkOrder: Codable {
    var id: UUID
    var customerSignature: String?
}

struct MedicalReleaseRecord: Codable {
    let patientSignaturePng: Data
}

// Stored properties whose type is inferred from the initial value.
final class RentalWaiver {
    var renterName = ""
    var signature = Data()
    let witnessSignature = ""
}
