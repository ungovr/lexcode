// lexcode-expect: 0
// Not a follow relation between user accounts: a follow-up task on a support case, a Raft
// follower node, a JDBC connection, a billing subscription, a follower in one class and the
// followed side in another, a following count beside an unrelated field, a follower beside a
// leader, and locals inside a method (block, typed and expression bodies).
package demo.social

import jakarta.persistence.Entity
import jakarta.persistence.Id
import org.springframework.data.jpa.repository.JpaRepository

@Entity
class FollowUpTask(
    @Id val id: Long,
    val caseId: String,
    val followUpNote: String,
    var followUpDone: Boolean = false,
)

data class RaftNode(val follower: Role, val leader: Node, val peers: List<Node>)

class Role

class Node

@Entity
data class DatabaseConnection(@Id val id: Long, val jdbcUrl: String)

@Entity
class PlanSubscription(
    @Id val id: Long,
    val customerId: String,
    val planId: String,
)

data class FollowerStats(val followerCount: Int, val followingLabel: String)

class FollowerSide {
    var follower: Role? = null
}

class FollowedSide {
    var followed: Role? = null
}

data class ProfileView(val name: String, val following: Int)

class ProfileCard {
    var name: String = ""
    var following: Int = 0
}

class RaftMember {
    var follower: Role? = null
    var leader: Node? = null
}

class Scheduler {
    var following: Role? = null

    fun elect() {
        val follower: Node = Node()
        println(follower)
    }

    fun pick(): Node {
        val follower: Node = Node()
        return follower
    }

    fun lookup() = run {
        val follower: Node = Node()
        follower
    }
}

interface FollowUpRepository : JpaRepository<FollowUpTask, Long> {
    fun findByCaseId(caseId: String): List<FollowUpTask>

    fun findByFollowUpDoneFalse(): List<FollowUpTask>
}
