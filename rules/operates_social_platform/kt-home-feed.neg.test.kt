// lexcode-expect: 0
// Not a feed of the accounts a user follows: a user's own posts, a team's tasks, follow-up
// tasks (also joined to a FollowUp table), an RSS feed lookup, and allow-list and block-list filters on an author.
package demo.social

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

class Post(val id: Long, val authorId: Long, val body: String)

interface PostRepository : JpaRepository<Post, Long> {
    @Query("select p from Post p where p.authorId = :userId order by p.createdAt desc")
    fun ownPosts(userId: Long): List<Post>

    @Query(
        """
        select t from Task t where t.assignee in (select m.user from TeamMember m where m.team = :team)
        """
    )
    fun teamTasks(team: Long): List<Post>

    @Query("select t from Task t where t.owner in (select f.assignee from FollowUp f where f.followUpDone = false)")
    fun openFollowUps(): List<Post>

    @Query("select p from Post p join FollowUp f on f.post = p where f.followUpDone = false")
    fun withOpenFollowUps(): List<Post>

    @Query(value = "select * from tasks t where t.owner_id in (1, 2) and t.follow_up_date < :d", nativeQuery = true)
    fun overdue(d: String): List<Post>

    fun findByAuthorIdOrderByCreatedAtDesc(authorId: Long): List<Post>

    fun findPostsByFollowUpIds(followUpIds: List<Long>): List<Post>

    fun findFeedItemsByFeedUrlIn(urls: List<String>): List<Post>
}

class Moderation {
    fun visible(posts: List<Post>, following: Set<Long>, allowedAuthors: List<Long>, blocked: Set<Long>): List<Post> {
        val a = posts.filter { allowedAuthors.contains(it.authorId) }
        val b = posts.filter { it.authorId in allowedAuthors }
        val c = posts.filter { following.contains(it.id) }
        return a + c + b.filter { blocked.contains(it.authorId) }
    }
}
