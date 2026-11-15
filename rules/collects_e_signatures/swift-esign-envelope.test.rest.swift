// lexcode-expect: 5
import Foundation
import Vapor

// A Vapor server that sends documents for signature through e-signature services' REST APIs
// (DocuSign envelopes, Dropbox Sign signature requests, Acrobat Sign agreements).
struct SignatureController {
    func sendEnvelope(_ req: Request, accountId: String) async throws -> ClientResponse {
        try await req.client.post(URI(string: "https://demo.docusign.net/restapi/v2.1/accounts/\(accountId)/envelopes"))
    }

    func embeddedView(_ req: Request, accountId: String, envelopeId: String) async throws -> ClientResponse {
        try await req.client
            .post(
                "https://na3.docusign.net/restapi/v2.1/accounts/\(accountId)/envelopes/\(envelopeId)/views/recipient"
            )
    }

    func dropboxSign(_ req: Request) async throws -> ClientResponse {
        try await req.client.post("https://api.hellosign.com/v3/signature_request/send")
    }

    func dropboxSignEmbedded() -> URL? {
        URL(string: "https://api.dropboxsign.com/v3/signature_request/create_embedded")
    }

    func acrobatSign() -> URL? {
        URL(string: "https://api.na1.adobesign.com/api/rest/v6/agreements")
    }
}
