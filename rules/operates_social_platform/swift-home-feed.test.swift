// lexcode-expect: 5
import Foundation
import Fluent
import SQLKit

struct TimelineService {
    let db: Database

    func homeFeed(for followingIDs: [UUID]) async throws -> [Post] {
        try await Post.query(on: db)
            .filter(\.$author.$id ~~ followingIDs)
            .sort(\.$createdAt, .descending)
            .all()
    }

    func friendsFeed(posts: [Post], friendIds: Set<UUID>) -> [Post] {
        posts.filter { friendIds.contains($0.authorID) }
    }

    func followedFeed(posts: [Post], user: User) -> [Post] {
        posts.filter { post in user.following.contains(post.author.id) }
    }

    func rawFeed(sql: SQLDatabase, me: UUID) async throws -> [SQLRow] {
        try await sql.raw("""
            SELECT * FROM posts
            WHERE author_id IN (SELECT followed_id FROM follows WHERE follower_id = \(bind: me))
            ORDER BY created_at DESC
            """).all()
    }

    func legacyFeed(me: UUID) async throws -> [Post] {
        try await Post.query(on: db).filter(\Post.$user ~~ followedUsers(of: me)).all()
    }
}
