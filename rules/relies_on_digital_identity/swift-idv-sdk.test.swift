// lexcode-expect: 10
import UIKit
import Persona2
import Onfido
import Jumio
import Veriff
import StripeIdentity
import IdensicMobileSDK
import NFCPassportReader

// Identity verification through a vendor's SDK, whose result the app acts on.
final class VerifyViewController: UIViewController, InquiryDelegate {
    let passportReader = PassportReader()

    func persona() {
        Inquiry.from(templateId: "itmpl_123", delegate: self).build().start(from: self)
        let inquiry = Inquiry(config: InquiryConfiguration(templateId: "itmpl_456"), delegate: self)
        inquiry.start(from: self)
    }

    func onfido(token: String) async throws {
        let config = try OnfidoConfig.builder().withSDKToken(token).withDocumentStep().build()
        let flow = OnfidoFlow(withConfiguration: config)
            .with(responseHandler: { _ in })
        try flow.run()
        try await Onfido.OnfidoFlow(workflowConfiguration: WorkflowConfig(workflowRunId: "run", sdkToken: token)).run()
    }

    func jumio(token: String) {
        let sdk = Jumio.SDK()
        sdk.token = token
        sdk.startDefaultUI()
    }

    func veriff(url: String) async throws {
        VeriffSdk.shared.startAuthentication(sessionUrl: url, presentingFrom: self)
        try await VeriffSdk.shared
            .startAuthentication(sessionUrl: url)
    }

    func stripe(secret: String) {
        let sheet = IdentityVerificationSheet(verificationSessionClientSecret: secret)
        sheet.present(from: self) { _ in }
    }

    func sumsub(token: String) {
        let sdk = SNSMobileSDK(accessToken: token)
        sdk.present()
    }

    func passport(mrz: String) async throws {
        let passport = try await passportReader.readPassport(mrzKey: mrz, tags: [.COM, .DG1, .DG2])
        print(passport.documentNumber)
    }

    func inquiryComplete(inquiryId: String, status: String, fields: [String: InquiryField]) {}
    func inquiryCanceled(inquiryId: String?, sessionToken: String?) {}
    func inquiryError(_ error: Error) {}
}
