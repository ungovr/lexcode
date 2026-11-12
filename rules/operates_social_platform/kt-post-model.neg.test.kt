// lexcode-expect: 0
// Not a post that users react to: a blog post a staff member writes, a comment left for staff to
// read, an order with comments, a thread of work, an address with a like count, a news post with
// comments and no author, a review post with an author and no comments or reactions, and a
// social-looking class whose name is not a post, post classes holding only half of a pair (an
// author, or comments, or a rating), non-post classes holding an author and comments, and
// locals named likes, comments or replies inside methods of post classes.
package demo.social

import jakarta.persistence.Entity
import jakarta.persistence.Id

@Entity
data class BlogPost(@Id val id: Long, val title: String, val body: String)

class FeedbackComment(val id: Long, val authorId: Long, var likes: Int = 0)

class Order(val id: Long, val authorId: Long, val comments: List<String>)

class WorkerThread {
    var likes: Int = 0
}

class PostalAddress(val street: String, val likes: Int)

class NewsPost {
    var title: String = ""
    var comments: MutableList<String> = mutableListOf()
}

data class ReviewPost(val id: Long, val authorId: Long, val rating: Int)

class Profile(val authorId: Long, val comments: List<String>, val likes: Int)

class Release {
    fun tally(): Int {
        val likes: Int = 3
        val comments: Int = 4
        return likes + comments
    }
}

class ScheduledPost(val title: String) {
    fun tally(): Int {
        val likes: Int = 3
        return likes
    }

    fun again() {
        val likes: Int = 4
        println(likes)
    }

    fun total() = run {
        val likes: Int = 5
        likes
    }
}

data class NewsletterPost(val title: String, val comments: List<String>)

class Article {
    var author: User? = null
    var comments: MutableList<String> = mutableListOf()
}

class ReviewerPost {
    var author: User? = null
    var rating: Int = 0
}

class QuotePost {
    var author: User? = null

    fun count() {
        val comments: Int = 3
        println(comments)
    }

    fun size() = run {
        val comments: Int = 3
        comments
    }
}

class Column(val author: User) {
    var comments: MutableList<String> = mutableListOf()
}

class ColumnistPost(val title: String) {
    var comments: MutableList<String> = mutableListOf()
}

class ReaderPost(val author: User) {
    var rating: Int = 0
}

class DraftPost(val author: User) {
    fun count() {
        val replies: Int = 3
        println(replies)
    }

    fun size(): Int {
        val replies: Int = 3
        return replies
    }

    fun many() = run {
        val replies: Int = 3
        replies
    }
}

class User

class Postmortem {
    var likes: Int = 0
}
