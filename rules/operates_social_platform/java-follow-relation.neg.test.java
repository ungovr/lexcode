// lexcode-expect: 0
// Not a follow relation between user accounts: a follow-up task on a support case, a Raft
// follower node, a JDBC connection, and a subscription to a billing plan.
package demo.social;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

@Entity
class FollowUpTask {
  @Id
  Long id;
  String caseId;
  String followUpNote;
  boolean followUpDone;
}

class RaftNode {
  Role follower;
  Node leader;
  List<Node> peers;
}

class Role {
}

class Node {
}

@Entity
class DatabaseConnection {
  @Id
  Long id;
  String jdbcUrl;
}

@Entity
class PlanSubscription {
  @Id
  Long id;
  String customerId;
  String planId;
}

interface FollowUpRepository extends JpaRepository<FollowUpTask, Long> {
  List<FollowUpTask> findByCaseId(String caseId);

  List<FollowUpTask> findByFollowUpDoneFalse();
}
