// lexcode-expect: 5
import Foundation
import Fluent
import SwiftData

// A client model of a post with reactions, decoded from the app's own service.
struct Post: Codable, Identifiable {
    let id: UUID
    let body: String
    let likeCount: Int
}

// A Fluent model: a reply thread with an author.
final class Tweet: Model, Content {
    static let schema = "tweets"
    @ID(key: .id) var id: UUID?
    @Parent(key: "author_id") var author: User
    @Children(for: \.$parent) var replies: [Tweet]
    @Field(key: "upvotes") var upvotes: Int

    init() {}
}

// A SwiftData model with an author and comments.
@Model
final class ForumPost {
    var title: String
    var user: User?
    var comments: [ForumComment] = []

    init(title: String) {
        self.title = title
    }
}

// A fediverse status with a default value.
struct TootDTO: Decodable {
    var favouritesCount: Int = 0
}
