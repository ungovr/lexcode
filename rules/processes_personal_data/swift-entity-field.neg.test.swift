// lexcode-expect: 0
import Foundation
import SwiftData

// With SwiftData imported: a field the store is told to skip, a computed property and a local
// variable are not stored; a plain struct is not a persistent model; and a model of article
// metadata has no field about a person.
@Model
final class DraftMessage {
    @Transient var email: String = ""
    var subject: String
    var phoneNumber: String {
        "redacted"
    }

    init(subject: String) {
        self.subject = subject
    }

    func normalise() {
        var email: String = subject.lowercased()
        email += "!"
        print(email)
    }
}

struct ContactFormInput: Codable {
    var email: String
    var firstName: String
}

@Model
final class Article {
    var title: String
    var languageCode: String
    var pageID: Int

    init(title: String, languageCode: String, pageID: Int) {
        self.title = title
        self.languageCode = languageCode
        self.pageID = pageID
    }
}
