// lexcode-expect: 0
import Foundation
import Vapor

// The nearest lookalikes: a vendor's marketing pages and help center (no API path), a link shown
// to the person, and an identity vendor's name in a log line. None calls the vendor's API.
struct VendorLinks {
    let pricing = URL(string: "https://withpersona.com/pricing")
    let help = URL(string: "https://help.onfido.com/hc/en-us/articles/123")
    let blog = URL(string: "https://www.veriff.com/blog/what-is-kyc")

    func log(_ req: Request) {
        req.logger.info("verification handled by api.onfido.com in production")
    }

    func ownServer(_ req: Request) async throws -> ClientResponse {
        try await req.client.post(URI(string: "https://api.example.org/v1/verifications"))
    }
}
