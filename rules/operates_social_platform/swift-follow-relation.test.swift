// lexcode-expect: 6
import Fluent
import Vapor

// A Fluent pivot: who follows whom.
final class UserFollow: Model {
    static let schema = "user_follows"
    @ID(key: .id) var id: UUID?
    @Parent(key: "follower_id") var follower: User
    @Parent(key: "followed_id") var followed: User

    init() {}
}

final class User: Model, Content {
    static let schema = "users"
    @ID(key: .id) var id: UUID?
    @Siblings(through: UserFollow.self, from: \.$follower, to: \.$followed) var following: [User]
}

// A friendship type on the client.
public struct Friendship: Codable, Hashable {
    let id: UUID
}

struct CreateUserFollow: AsyncMigration {
    func prepare(on database: Database) async throws {
        try await database.schema("user_follows")
            .id()
            .field("follower_id", .uuid, .required)
            .create()
    }

    func revert(on database: Database) async throws {
        try await database.schema("user_follows").delete()
    }
}

func following(of user: User, on db: Database) async throws -> [UserFollow] {
    try await UserFollow.query(on: db).filter(\.$follower.$id == user.requireID()).all()
}

// A follow record decoded from the app's own service.
struct FollowEdge: Decodable {
    let followerId: String
    let followingId: String
}
