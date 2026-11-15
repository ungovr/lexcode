// lexcode-expect: 0
import Foundation

// The app's own PublishInput and createDm in a file with neither the AWS SNS nor a Discord library
// import: a loop over a local event bus and a draft-message store.
struct PublishInput {
    var message: String
    var phoneNumber: String
}

final class LocalBus {
    func fanOut(_ phones: [String]) {
        for phone in phones {
            bus.publish(input: PublishInput(message: "contact updated", phoneNumber: phone))
        }
        for draft in drafts {
            store.createDm(draft)
        }
    }
}
