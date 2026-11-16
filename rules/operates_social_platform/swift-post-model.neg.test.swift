// lexcode-expect: 0
// A post with no reactions and no thread (a blog article the owner writes), a comment left for staff
// (the definition's exclusion), a job posting with an owner, a code host's issue comment with
// reactions read by a bot, and a local count in a method of a post type.
import Foundation

struct BlogPost: Codable {
    let title: String
    let author: String
    let body: String
}

struct FeedbackComment: Codable {
    let author: String
    var replies: [FeedbackComment]
}

struct JobPosting: Codable {
    let owner: String
    let comments: String?
}

struct IssueComment: Decodable {
    let user: String
    let reactions: [String: Int]
}

struct Post: Codable {
    let title: String
    let author: String

    func summary() -> String {
        let likes: Int = 0
        let comments: [String] = []
        return "\(title) \(likes) \(comments.count)"
    }
}
