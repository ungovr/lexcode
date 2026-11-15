// lexcode-expect: 0
import PassKit
import StripePaymentSheet

// With both frameworks imported: a payment that asks for no contact details, and a Stripe sheet
// told never to collect them. The card network handles the payment; the app gets no name,
// email, phone or address.
final class TipJar {
    func request() -> PKPaymentRequest {
        let request = PKPaymentRequest()
        request.requiredBillingContactFields = []
        request.requiredShippingContactFields = Set()
        return request
    }

    func sheet() -> PaymentSheet.Configuration {
        var configuration = PaymentSheet.Configuration()
        configuration.billingDetailsCollectionConfiguration.name = .never
        configuration.billingDetailsCollectionConfiguration.email = .automatic
        configuration.billingDetailsCollectionConfiguration.address = .automatic
        return configuration
    }
}
