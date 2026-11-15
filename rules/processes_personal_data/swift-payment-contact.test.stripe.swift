// lexcode-expect: 4
import StripePaymentSheet
import UIKit

final class CheckoutViewController: UIViewController {
    func configuration(customerEmail: String, customerName: String) -> PaymentSheet.Configuration {
        var configuration = PaymentSheet.Configuration()
        configuration.merchantDisplayName = "Example, Inc."
        configuration.billingDetailsCollectionConfiguration.email = .always
        configuration.billingDetailsCollectionConfiguration.address = .full
        configuration.billingDetailsCollectionConfiguration.attachDefaultsToPaymentMethod = true
        configuration.defaultBillingDetails.email = customerEmail
        configuration.defaultBillingDetails.name = customerName
        return configuration
    }
}
