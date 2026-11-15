// lexcode-expect: 5
import Contacts
import ContactsUI
import UIKit

final class InviteFriends: UIViewController, CNContactPickerDelegate {
    let store = CNContactStore()
    let keys = [CNContactGivenNameKey, CNContactEmailAddressesKey] as [CNKeyDescriptor]

    func allContacts() throws -> [CNContact] {
        var found: [CNContact] = []
        let request = CNContactFetchRequest(keysToFetch: keys)
        try store.enumerateContacts(with: request) { contact, _ in
            found.append(contact)
        }
        return found
    }

    func search(_ name: String) throws -> [CNContact] {
        try store.unifiedContacts(
            matching: CNContact.predicateForContacts(matchingName: name),
            keysToFetch: keys
        )
    }

    func one(_ id: String) throws -> CNContact {
        try store.unifiedContact(withIdentifier: id, keysToFetch: keys)
    }

    func pick() {
        let picker = CNContactPickerViewController()
        picker.delegate = self
        present(picker, animated: true)
    }
}
