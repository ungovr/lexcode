// lexcode-expect: 0
import Foundation

// Values that change with each request or visit (each word the rule leaves out, in a name that
// would match without it), the account, workspace or document a request is about, an app's
// installation on a platform (GitHub), an ID kept only on the device, and headers whose name and
// value say nothing of an install.
final class RequestDecorator {
    let installID = UUID().uuidString

    func decorate(_ request: inout URLRequest, session: String, lock: String) {
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-Device-Id")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Trace-Device-Id")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Correlation-Device-UUID")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Transaction-Install-Id")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Idempotency-Install-Id")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Message-Device-Id")
        request.setValue(session, forHTTPHeaderField: "X-Session-Device-Id")
        request.setValue(UUID().uuidString, forHTTPHeaderField: "X-Nonce-Install-Id")
        request.setValue(session, forHTTPHeaderField: "X-User-UUID")
        request.setValue(lock, forHTTPHeaderField: "X-Account-Uuid")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue(lock, forHTTPHeaderField: "Lock-Device")
        UserDefaults.standard.set(installID, forKey: "install_id")
        print("install \(installID)")
    }

    func entities(_ request: inout URLRequest, workspaceUUID: String, org: String, doc: String) {
        request.setValue(workspaceUUID, forHTTPHeaderField: "X-Cmux-Workspace-UUID")
        request.setValue(org, forHTTPHeaderField: "X-Organization-UUID")
        request.setValue(workspaceUUID, forHTTPHeaderField: "X-Workspace-UUID")
        request.setValue(doc, forHTTPHeaderField: "X-Document-UUID")
        request.addValue(doc, forHTTPHeaderField: "X-Project-UUID")
        request.setValue(org, forHTTPHeaderField: "X-ORG-UUID")
        request.setValue(org, forHTTPHeaderField: "X-USR-UUID")
        request.setValue(doc, forHTTPHeaderField: "X-REQ-UUID")
        request.setValue(org, forHTTPHeaderField: "X-USER-UUID")
        request.setValue(org, forHTTPHeaderField: "X-ACCT-UUID")
        request.setValue(doc, forHTTPHeaderField: "X-MSG-UUID")
        request.setValue(doc, forHTTPHeaderField: "X-TXN-UUID")
        request.setValue(doc, forHTTPHeaderField: "X-SID-UUID")
        request.setValue(doc, forHTTPHeaderField: "X-DOC-UUID")
        request.setValue(doc, forHTTPHeaderField: "X-WMF-APP-UUID")
    }

    // A vendor's namespace and the entity a request is about read the same in an X-<name>-UUID
    // header, so only the two names the rule lists are read.
    func namedUUIDs(_ request: inout URLRequest, id: String) {
        request.setValue(id, forHTTPHeaderField: "X-API-UUID")
        request.setValue(id, forHTTPHeaderField: "X-SKU-UUID")
        request.setValue(id, forHTTPHeaderField: "X-PO-UUID")
        request.setValue(id, forHTTPHeaderField: "X-CRM-UUID")
        request.setValue(id, forHTTPHeaderField: "X-TEAM-UUID")
        request.setValue(id, forHTTPHeaderField: "X-ORDER-UUID")
        request.setValue(id, forHTTPHeaderField: "X-CART-UUID")
        request.setValue(id, forHTTPHeaderField: "X-FILE-UUID")
        request.setValue(id, forHTTPHeaderField: "X-ROOM-UUID")
        request.setValue(id, forHTTPHeaderField: "X-CHAT-UUID")
        request.setValue(id, forHTTPHeaderField: "X-CUST-UUID")
        request.setValue(id, forHTTPHeaderField: "X-PID-UUID")
        request.setValue(id, forHTTPHeaderField: "X-ACME-UUID")
    }

    // A device header that names another device (the one the request drives), not the phone.
    func otherDevices(_ request: inout URLRequest, id: String) {
        request.setValue(id, forHTTPHeaderField: "X-Lock-Device-Id")
        request.setValue(id, forHTTPHeaderField: "X-Camera-Device-Id")
        request.setValue(id, forHTTPHeaderField: "X-Target-Device-Id")
        request.setValue(id, forHTTPHeaderField: "X-Peer-Device-Id")
        request.setValue(id, forHTTPHeaderField: "X-Remote-Device-UUID")
        request.setValue(id, forHTTPHeaderField: "X-Paired-Device-Id")
    }

    func github(_ request: inout URLRequest, githubInstallationID: Int, installationID: String) {
        request.setValue("\(githubInstallationID)", forHTTPHeaderField: "X-GitHub-Installation-Id")
        request.setValue(installationID, forHTTPHeaderField: "X-Hook-Installation")
    }
}

private extension URLRequest {
    mutating func trace() {
        setValue(UUID().uuidString, forHTTPHeaderField: "X-Request-Install-Id")
        addValue("gzip", forHTTPHeaderField: "Accept-Encoding")
    }
}
