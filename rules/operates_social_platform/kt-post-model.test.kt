// lexcode-expect: 8
// Posts that users write and react to: a post with a reaction count (in the constructor or the
// body), and a post with an author and comments (both in the constructor, both in the body, or
// the author in the constructor and the comments in the body).
package demo.social

import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.OneToMany

@Entity
data class Post(@Id val id: Long, val authorId: Long, val body: String, var likeCount: Int = 0)

class Tweet {
    var text: String = ""
    var retweetCount: Int = 0
}

class WallPost(val body: String, var upvotes: Int)

data class Reply(val id: Long, val author: User, val replies: List<Reply>)

class ForumPost {
    var creator: User? = null

    @OneToMany
    var comments: MutableList<String> = mutableListOf()
}

@Entity
class StatusUpdate(val userId: Long) {
    @OneToMany
    val replies: MutableList<String> = mutableListOf()
}

class Toot(var user: User, var commentCount: Int)

class FavoritePost {
    private val favorites: MutableList<Long> = mutableListOf()
}

class User
