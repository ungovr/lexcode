// lexcode-expect: 0
// A feed of the user's own posts and of followed topics, follow-up reminders, and a Fluent-shaped
// filter in a file without Fluent.
import Foundation

struct Feeds {
    func mine(posts: [Post], me: UUID) -> [Post] {
        posts.filter { $0.authorID == me }
    }

    func topics(posts: [Post], followedTopics: Set<String>) -> [Post] {
        posts.filter { followedTopics.contains($0.topic) }
    }

    func reminders(tasks: [Task], followUps: Set<UUID>) -> [Task] {
        tasks.filter { followUps.contains($0.ownerID) }
    }

    func local(store: Store, followingIDs: [UUID]) -> [Post] {
        store.filter(\.$author.$id ~~ followingIDs)
    }

    let note = "SELECT * FROM tasks WHERE owner_id IN (SELECT id FROM follow_ups)"
}
