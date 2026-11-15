// lexcode-expect: 6
import Foundation
import Vapor

// Calls to identity-verification vendors' APIs, from a Vapor server and from URLSession.
struct VerificationController {
    func createInquiry(_ req: Request) async throws -> ClientResponse {
        try await req.client.post("https://withpersona.com/api/v1/inquiries") { out in
            try out.content.encode(["data": ["attributes": ["inquiry-template-id": "itmpl_123"]]])
        }
    }

    func applicant(_ req: Request, id: String) async throws -> ClientResponse {
        try await req.client.get(URI(string: "https://api.eu.onfido.com/v3.6/applicants/\(id)"))
    }

    func session(_ req: Request) async throws -> ClientResponse {
        try await req.client
            .post(
                "https://stationapi.veriff.com/v1/sessions"
            )
    }

    func decision(id: String) async throws -> Data {
        let url = URL(string: "https://stationapi.veriff.com/v1/sessions/\(id)/decision")!
        let (data, _) = try await URLSession.shared.data(from: url)
        return data
    }

    func sumsub(id: String) -> URLRequest {
        URLRequest(url: Foundation.URL(string: "https://api.sumsub.com/resources/applicants/\(id)/one")!)
    }

    func yoti() -> URLComponents? {
        URLComponents(string: "https://api.yoti.com/idverify/v1/sessions")
    }
}
