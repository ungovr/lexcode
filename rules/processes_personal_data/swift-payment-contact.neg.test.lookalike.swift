// lexcode-expect: 0
import Foundation

// The app's own order form with the frameworks' property names, in a file that imports neither
// PassKit nor Stripe: a list of form sections to show, holding no one's details.
struct OrderForm {
    var requiredBillingContactFields: [String] = []
    var defaultBillingDetails = Defaults()
    var billingDetailsCollectionConfiguration = Defaults()
}

struct Defaults {
    var email: String = ""
    var address: String = ""
}

func build() -> OrderForm {
    var form = OrderForm()
    form.requiredBillingContactFields = ["name", "postalAddress"]
    form.defaultBillingDetails.email = "placeholder"
    form.billingDetailsCollectionConfiguration.address = ".full"
    return form
}
