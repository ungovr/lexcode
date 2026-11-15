// lexcode-expect: 7
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

    // Reads across an actor boundary, awaited.
    func myCard(book: AddressBook) async throws -> CNContact {
        try await book.store.unifiedMeContactWithKeys(toFetch: book.keys)
    }

    func maybeCard(book: AddressBook, id: String) async -> CNContact? {
        try? await book.store.unifiedContact(withIdentifier: id, keysToFetch: book.keys)
    }

    func pick() {
        let picker = CNContactPickerViewController()
        picker.delegate = self
        present(picker, animated: true)
    }
}

actor AddressBook {
    let store = CNContactStore()
    let keys = [CNContactEmailAddressesKey] as [CNKeyDescriptor]
}
