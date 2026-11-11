// lexcode-expect: 5
// A post that users write and other users react to: likes, upvotes or reactions, or an author with
// comments or replies, the way a wall, a forum or a feed stores them.
package demo.social;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import java.util.ArrayList;
import java.util.List;

class Post {
  private List<Comment> comments = new ArrayList<>();
  private String content = "";
  private String creatorId = null;
  private int numberOfLikes = 0;
}

@Entity
class ForumPost {
  @Id
  Long id;
  Long authorId;
  String body;

  @OneToMany
  List<ForumPost> replies;
}

@Entity
class Tweet {
  @Id
  Long id;
  String userId;
  String text;
  int likeCount;
  int retweetCount;
}

@Entity
class WallPost {
  @Id
  Long id;
  String createdBy;
  String message;
  List<String> reactions;
}

@Entity
class ConversationPost {
  @Id
  Long id;
  String message;
  Integer upvotes = 0;
  Integer reactionCount = 0;
}

class Comment {
  String body;
}
