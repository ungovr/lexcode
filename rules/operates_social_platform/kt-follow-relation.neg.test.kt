// lexcode-expect: 0
// Not a follow relation between user accounts: a follow-up task on a support case, a Raft
// follower node, a JDBC connection, a billing subscription, a follower in one class and the
// followed side in another, and locals inside a method.
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

class Scheduler {
    var following: Role? = null

    fun elect() {
        val follower: Node = Node()
        println(follower)
    }
}

interface FollowUpRepository : JpaRepository<FollowUpTask, Long> {
    fun findByCaseId(caseId: String): List<FollowUpTask>

    fun findByFollowUpDoneFalse(): List<FollowUpTask>
}
