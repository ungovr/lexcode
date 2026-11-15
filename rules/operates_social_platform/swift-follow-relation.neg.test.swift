// lexcode-expect: 0
// Following a topic or a feed, not a person (the nearest lookalike), follower counts on a profile, a
// friendship status word, a follow-up task, and Fluent-shaped calls in a file without Fluent.
import Foundation

struct TopicSubscription: Codable {
    let topicId: String
    let following: Bool
}

struct Profile: Codable {
    let followersCount: Int
    let followingCount: Int
}

enum FriendshipStatus: String {
    case none, pending, accepted
}

struct FollowUpTask: Codable {
    let follower: String
    let dueDate: Date
}

final class Store {
    func schema(_ name: String) -> Store { self }
    func filter(_ isIncluded: Bool) -> Store { self }
}

func load(store: Store, follower: String) {
    _ = store.schema("follows")
    _ = store.filter(\String.count == 3)
}
