// lexcode-expect: 2
import Fluent
import Vapor

// A Vapor service's Fluent models for a signed rental agreement and a signed waiver.
final class RentalAgreement: Model, Content, @unchecked Sendable {
    static let schema = "rental_agreements"

    @ID(key: .id) var id: UUID?
    @Field(key: "renter_name") var renterName: String
    @Field(key: "signature")
    var signature: String
    @Timestamp(key: "signed_at", on: .create) var signedAt: Date?

    init() {}
}

final class Waiver: Model, @unchecked Sendable {
    static let schema = "waivers"

    @ID(key: .id) var id: UUID?
    @OptionalField(key: "drawn_signature") var drawnSignature: Data?

    init() {}
}
