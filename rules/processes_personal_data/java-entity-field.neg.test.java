// lexcode-expect: 0
// Personal-looking names that are not stored: a request object, a constant, a transient
// field, a local variable, and an entity whose columns hold nothing about a person.
package demo.shop;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Transient;

// Not an entity: a plain command object that is never persisted.
class EmailTemplateRequest {
  private String email;
  private String phone;
}

@Entity
public class Product {
  // The word appears in a constant and in a transient, unmapped field.
  private static final String EMAIL = "email";
  private static String phone;

  @Transient
  private String email;

  @Id
  private Long id;

  @Column(name = "title")
  private String title;

  @Column(name = "price_cents")
  private long priceCents;

  @Column(name = "email_template")
  private String emailTemplate;

  public String describe() {
    // A local variable inside an entity method is not a column.
    String phone;
    phone = "n/a";
    return title + phone;
  }
}
