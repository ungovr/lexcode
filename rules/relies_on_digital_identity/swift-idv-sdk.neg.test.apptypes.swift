// lexcode-expect: 0
import Foundation

// The app's own types with the vendors' generic short names, in a file without any vendor
// import: a support-ticket inquiry, a plugin SDK handle, a document sheet and a passport-photo
// size checker for a travel app.
struct Inquiry {
    static func from(templateId: String, delegate: AnyObject?) -> Inquiry { Inquiry(config: templateId, delegate: delegate) }
    init(config: String, delegate: AnyObject?) {}
    func start(from host: AnyObject) {}
}

final class SDK {
    var token = ""
}

struct IdentityVerificationSheet {
    init(verificationSessionClientSecret: String) {}
}

final class PassportReader {
    func readPassport(mrzKey: String) async throws -> String { mrzKey }
}

final class Support {
    func open(host: AnyObject) async throws {
        Inquiry.from(templateId: "faq", delegate: nil).start(from: host)
        Inquiry(config: "billing", delegate: nil).start(from: host)
        let plugin = SDK()
        plugin.token = "t"
        _ = IdentityVerificationSheet(verificationSessionClientSecret: "s")
        _ = try await PassportReader().readPassport(mrzKey: "photo-size")
    }
}
