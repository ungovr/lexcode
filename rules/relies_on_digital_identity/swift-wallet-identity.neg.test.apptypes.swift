// lexcode-expect: 0
import Foundation

// The app's own types with Apple's short names, in a file without PassKit or ProximityReader: a
// library-card app's request for a member's card details from its own server.
struct PKIdentityRequest {
    var memberID: String = ""
}

struct MobileDriversLicenseDisplayRequest {
    let fields: [String]
}

final class CardLookup {
    func run() async throws {
        var request = PKIdentityRequest()
        request.memberID = "42"
        let display = MobileDriversLicenseDisplayRequest(fields: ["name"])
        print(request, display)
    }
}
