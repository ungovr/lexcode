// lexcode-expect: 6
// Follow and friend relations between user accounts: an entity pairing a follower with the
// account followed, friendship entities, and Spring Data finders keyed on the relation.
package demo.social;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

@Entity
class Follow {
  @Id
  Long id;

  @ManyToOne
  private User follower = null;

  @ManyToOne
  private User followed;
}

@Entity
class Friendship {
  @Id
  Long id;
  Long userId;
  Long friendId;
}

@Entity
class FriendRequest {
  @Id
  Long id;
  Long fromUserId;
  Long toUserId;
}

@Entity
class Relationship {
  @Id
  Long id;
  Long followerId;
  Long followingId;
}

class User {
}

interface FollowRepository extends JpaRepository<Follow, Long> {
  List<Follow> findByFollowerId(Long userId);

  boolean existsByFollowerIdAndFollowedId(Long a, Long b);
}
