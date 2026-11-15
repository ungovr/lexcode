// lexcode-expect: 0
import Contacts

// With Contacts imported: only the permission status is read, and an address the app already
// holds (its own office) is formatted for display. No one's address book entry is read.
final class ContactsSettings {
    var canInvite: Bool {
        CNContactStore.authorizationStatus(for: .contacts) == .authorized
    }

    func officeAddress() -> String {
        let address = CNMutablePostalAddress()
        address.street = "1 Main Street"
        address.city = "Galway"
        return CNPostalAddressFormatter.string(from: address, style: .mailingAddress)
    }
}
