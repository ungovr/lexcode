// lexcode-expect: 4
import UIKit
import DocuSignSDK

// The DocuSign iOS SDK: captive (embedded) signing, remote signing, offline signing and sending
// an envelope composed in the app.
final class LeaseSigningViewController: UIViewController {
    let signingManager = DSMSigningManager()
    let envelopesManager = DSMEnvelopesManager()

    func signHere(envelopeId: String, tenant: String, email: String) {
        signingManager.presentCaptiveSigning(withPresenting: self, envelopeId: envelopeId, recipientUserName: tenant,
                                             recipientEmail: email, recipientClientUserId: "1", animated: true) { _, _ in }
    }

    func signRemote(envelopeId: String) async throws {
        try await signingManager
            .presentSigning(withPresenting: self, envelopeId: envelopeId, animated: true)
    }

    func signOffline(envelopeId: String) {
        DSMSigningManager().signOffline(withPresenting: self, envelopeId: envelopeId, animated: true) { _, _ in }
    }

    func send(definition: DSMEnvelopeDefinition) async throws {
        _ = try await envelopesManager.composeEnvelope(with: definition, signingMode: .online)
        envelopesManager.syncEnvelopes()
    }
}
