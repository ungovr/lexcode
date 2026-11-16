// lexcode-expect: 4
import SwiftUI
import Firebase

// Firebase reached through its umbrella module.
struct CheckoutView: View {
    let userID: String

    var body: some View {
        Button("Buy") {
            Analytics.logEvent(AnalyticsEventPurchase, parameters: [
                AnalyticsParameterValue: 9.99,
            ])
        }
        .onAppear {
            Analytics.setUserID(userID)
            Crashlytics
                .crashlytics()
                .setUserID(userID)
        }
        .task {
            try? await Crashlytics.crashlytics().setUserID(userID)
        }
    }
}
