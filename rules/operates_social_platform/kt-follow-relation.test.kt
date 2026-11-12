// lexcode-expect: 9
// Follow and friend relations between user accounts: a class pairing a follower with the account
// followed (in the constructor, in the body, or split between them), friendship classes, and
// Spring Data finders keyed on the relation.
package demo.social

import jakarta.persistence.Entity
import jakarta.persistence.Id
import jakarta.persistence.ManyToOne
import org.springframework.data.jpa.repository.JpaRepository

@Entity
data class Follow(@Id val id: Long, val followerId: Long, val followedId: Long)

data class Edge(val id: Long = 0, var following: User? = null, var follower: User? = null)

@Entity
class Subscription {
    @Id
    var id: Long = 0

    @ManyToOne
    var follower: User? = null

    @ManyToOne
    private val followee: User? = null
}

class Link(val id: Long) {
    private val follower: User
    lateinit var followed: User
}

data class Friendship(val userId: Long, val friendId: Long)

class FriendRequest {
    var fromUserId: Long = 0
}

class FriendConnection(val id: Long) {
    fun accept() = Unit
}

class User

interface FollowRepository : JpaRepository<Follow, Long> {
    fun findByFollowerId(userId: Long): List<Follow>

    fun existsByFollowerIdAndFollowedId(a: Long, b: Long): Boolean
}
