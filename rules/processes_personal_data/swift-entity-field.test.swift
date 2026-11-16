// lexcode-expect: 7
import Foundation
import SwiftData

@Model
final class Customer {
    var firstName: String
    var email: String
    @Attribute(.unique) var emailAddress: String
    var dateOfBirth: Date?
    var shippingAddress: String = ""
    var phoneNumber: String? = nil
    var loyaltyPoints: Int = 0

    init(firstName: String, email: String) {
        self.firstName = firstName
        self.email = email
        self.emailAddress = email
    }
}

@Model
class Visit {
    var ipAddress: String
    var startedAt: Date

    init(ipAddress: String) {
        self.ipAddress = ipAddress
        self.startedAt = .now
    }
}
