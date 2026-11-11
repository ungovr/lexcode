// lexcode-expect: 5
// Selecting the posts written by the accounts a user follows or befriends, which builds a feed.
package demo.social;

import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface PostRepository extends JpaRepository<Post, Long> {

  @Query("select p from Post p where p.author.id in (select f.followed.id from Follow f where f.follower.id = :userId) order by p.createdAt desc")
  List<Post> feedFor(Long userId);

  @Query("select p from Post p join Friendship f on f.friendId = p.authorId where f.userId = :userId")
  List<Post> friendPosts(Long userId);

  List<Post> findByAuthorIdInOrderByCreatedAtDesc(List<Long> followingIds);

  List<Post> findPostsByAuthorIn(List<User> friends);
}

class Post {
  Long authorId;

  Long getAuthorId() {
    return authorId;
  }
}

class User {
}

class Timeline {
  List<Post> build(List<Post> posts, Set<Long> following) {
    return posts.stream().filter(p -> following.contains(p.getAuthorId())).toList();
  }
}
