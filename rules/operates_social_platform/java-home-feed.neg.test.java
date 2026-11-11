// lexcode-expect: 0
// Not a feed of posts from followed accounts: a user's own posts, a filter by an allow list,
// an RSS feed of articles, and a follow-up queue for support cases.
package demo.social;

import java.util.List;
import java.util.Set;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

interface PostRepository extends JpaRepository<Post, Long> {

  @Query("select p from Post p where p.author.id = :authorId order by p.createdAt desc")
  List<Post> ownPosts(Long authorId);

  @Query("select t from Task t where t.owner.id in (select m.id from Member m where m.team = :team)")
  List<Post> teamTasks(String team);

  List<Post> findByAuthorIdOrderByCreatedAtDesc(Long authorId);

  List<Post> findByCaseIdInOrderByDueDate(List<Long> followUpIds);
}

interface ArticleRepository extends JpaRepository<Article, Long> {
  List<Article> findFeedItemsByFeedUrlIn(List<String> feedUrls);
}

class Post {
  Long authorId;
}

class Article {
}

class Visibility {
  List<Post> visible(List<Post> posts, Set<Long> allowedIds) {
    return posts.stream().filter(p -> allowedIds.contains(p.getAuthorId())).toList();
  }
}
