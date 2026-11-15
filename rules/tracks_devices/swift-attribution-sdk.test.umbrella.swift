// lexcode-expect: 3
import SwiftUI
import FacebookCore

// Meta's app events through the Swift FacebookCore wrapper, which re-exports FBSDKCoreKit.
struct CheckoutView: View {
    var body: some View {
        Button("Buy") {
            AppEvents.shared.logPurchase(amount: 9.99, currency: "USD")
        }
        .onAppear {
            AppEvents.shared.activateApp()
        }
        .task {
            try? await AppEvents.shared.logEvent(.viewedContent)
        }
    }
}
