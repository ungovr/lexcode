// lexcode-expect: 4
// A SwiftUI file that does not import UIKit (SwiftUI brings it), with the identifier written short and
// module-qualified, each kept in a stored property and sent from a method.
import SwiftUI

struct PingView: View {
    let vendorID = UIDevice.current.identifierForVendor?.uuidString ?? ""
    var qualifiedID = UIKit.UIDevice.current.identifierForVendor?.uuidString ?? ""
    let qualifiedLet = UIKit.UIDevice.current.identifierForVendor?.uuidString ?? ""
    var shortVar = UIDevice.current.identifierForVendor?.uuidString ?? ""

    var body: some View { Text("ping") }

    func ping() async throws {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        request.setValue(vendorID, forHTTPHeaderField: "X-Vendor")
        _ = try await URLSession.shared.data(for: request)
    }

    func pingAgain() {
        var request = URLRequest(url: URL(string: "https://api.example.com/v1/ping")!)
        request.addValue(qualifiedID, forHTTPHeaderField: "X-Vendor-2")
        request.addValue(qualifiedLet, forHTTPHeaderField: "X-Vendor-3")
        request.addValue(shortVar, forHTTPHeaderField: "X-Vendor-4")
        print(request)
    }
}
