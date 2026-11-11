// lexcode-expect: 6
// Posts selected by the accounts a user follows or befriends: queries (plain and raw string), a
// finder and a call keyed on the followed accounts, and collection filters on the author.
package demo.social

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query

class Post(val id: Long, val authorId: Long, val body: String)

interface FeedRepository : JpaRepository<Post, Long> {
    @Query("select p from Post p where p.author in (select f.followee from Follow f where f.follower.id = :me)")
    fun homeFeed(me: Long): List<Post>

    @Query(
        """
        select p from Post p join Friendship fr on fr.friend = p.author
        """
    )
    fun friendFeed(): List<Post>

    @Query("select p from Post p join Follow f on f.followee = p.author where f.follower = :me")
    fun joinFeed(me: Long): List<Post>

    fun findPostsByAuthorIdIn(following: List<Long>): List<Post>
}

class Timeline(private val repository: FeedRepository, private val following: Set<Long>) {
    fun load(posts: List<Post>): List<Post> {
        val a = posts.filter { following.contains(it.authorId) }
        return a + posts.filter { it.authorId in following }
    }
}
