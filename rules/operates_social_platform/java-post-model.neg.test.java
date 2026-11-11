// lexcode-expect: 0
// Not a user post other users react to: a staff-written blog entry, a comment for staff to read,
// an order with notes, a worker thread, and a post-office address.
package demo.social;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import java.util.List;

@Entity
class BlogPost {
  @Id
  Long id;
  String author;
  String title;
  String body;
  boolean published;
}

@Entity
class FeedbackComment {
  @Id
  Long id;
  String userId;
  String comments;
}

@Entity
class Order {
  @Id
  Long id;
  String ownerId;
  List<String> comments;
}

class WorkerThread extends Thread {
  String creator;
  int replies;
}

class PostalAddress {
  String userId;
  String postCode;
  int likes;
}

class Post {
  String title;
  String body;
}

class NewsPost {
  String title;
  String body;
  List<String> comments;
}

class ReviewPost {
  String authorId;
  String body;
}

class Comment {
  String authorId;
  String body;
}
