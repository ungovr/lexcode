// lexcode-expect: 0
import Foundation

// The app's own address book of company offices, with Apple's names, in a file without
// Contacts: no person's entry is read.
final class CNContactStore {
    func enumerateContacts(with request: CNContactFetchRequest, using block: (String, Bool) -> Void) {}
    func unifiedContacts(matching predicate: String, keysToFetch keys: [String]) -> [String] { [] }
}

struct CNContactFetchRequest {
    let keysToFetch: [String]
}

final class Offices {
    let store = CNContactStore()

    func list() {
        let request = CNContactFetchRequest(keysToFetch: ["city"])
        store.enumerateContacts(with: request) { office, _ in
            print(office)
        }
        print(store.unifiedContacts(matching: "Dublin", keysToFetch: ["city"]))
    }
}
