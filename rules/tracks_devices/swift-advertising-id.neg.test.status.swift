// lexcode-expect: 0
import AppTrackingTransparency
import AdSupport
import SwiftUI

// The nearest lookalike with the real frameworks imported: the app only reads whether tracking
// is allowed, to hide a personalised-ads toggle. It never asks and never reads the identifier.
struct AdsSettingsView: View {
    var trackingAllowed: Bool {
        ATTrackingManager.trackingAuthorizationStatus == .authorized
    }

    // The deprecated opt-out flag, read for the same toggle: not the identifier.
    var legacyAllowed: Bool {
        ASIdentifierManager.shared().isAdvertisingTrackingEnabled
    }

    var body: some View {
        Text(trackingAllowed ? "Personalised" : "Standard")
    }
}
