// lexcode-expect: 5
import SwiftUI
import Firebase
import FacebookCore

// Firebase reached through its umbrella module, and Meta's app events through the Swift
// FacebookCore wrapper.
struct CheckoutView: View {
    let userID: String

    var body: some View {
        Button("Buy") {
            Analytics.logEvent(AnalyticsEventPurchase, parameters: [
                AnalyticsParameterValue: 9.99,
            ])
            AppEvents.shared.logPurchase(amount: 9.99, currency: "USD")
        }
        .onAppear {
            Analytics.setUserID(userID)
            Crashlytics
                .crashlytics()
                .setUserID(userID)
            AppEvents.shared.activateApp()
        }
    }
}
