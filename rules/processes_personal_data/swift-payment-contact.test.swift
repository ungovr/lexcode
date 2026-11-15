// lexcode-expect: 3
import PassKit
import UIKit

final class DonationSheet: NSObject, PKPaymentAuthorizationControllerDelegate {
    func request(amount: NSDecimalNumber) -> PKPaymentRequest {
        let request = PKPaymentRequest()
        request.merchantIdentifier = "merchant.org.example"
        request.paymentSummaryItems = [PKPaymentSummaryItem(label: "Donation", amount: amount)]
        request.requiredBillingContactFields = [.name, .postalAddress]
        request.requiredShippingContactFields = [.emailAddress]
        return request
    }

    func phoneToo(_ request: PKPaymentRequest) {
        request.requiredShippingContactFields = Set([PKContactField.phoneNumber])
    }

    func paymentAuthorizationController(
        _ controller: PKPaymentAuthorizationController,
        didAuthorizePayment payment: PKPayment,
        handler completion: @escaping (PKPaymentAuthorizationResult) -> Void
    ) {
        completion(PKPaymentAuthorizationResult(status: .success, errors: nil))
    }

    func paymentAuthorizationControllerDidFinish(_ controller: PKPaymentAuthorizationController) {}
}
