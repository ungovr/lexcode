// lexcode-expect: 0
// Bindings beside a model call that hold something else: a second name bound from an earlier one
// that does not hold the reply, and a binding from a value derived from another source.
import OpenAI
import SwiftUI

@MainActor
final class ProfileModel: ObservableObject {
    let openAI = OpenAI(apiToken: "token")
    let store = ProfileStore()
    @Published var reply = ""
    @Published var answer = ""

    func chained(_ query: ChatQuery) async throws {
        _ = try await openAI.chats(query: query)
        guard let profile = store.profile, let bio = profile.bio else { return }
        reply = bio
    }

    func derived(_ query: ChatQuery) async throws {
        let result = try await openAI.chats(query: query)
        print(result.id)
        let drafts = store.drafts
        if let text = drafts.first {
            answer = text
        }
    }
}

final class ProfileStore {
    var profile: Profile?
    var drafts: [String] = []
}

struct Profile {
    var bio: String?
}
