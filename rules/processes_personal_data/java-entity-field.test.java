// lexcode-expect: 6
// Persistent classes whose columns hold an email address, a phone number, a date of birth,
// a government identifier or an IP address.
package demo.accounts;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import org.springframework.data.mongodb.core.mapping.Document;

@Entity
@Table(name = "customers")
public class Customer {
  @Id
  private Long id;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(name = "phone_number")
  private String phoneNumber;

  private LocalDate dateOfBirth;

  @Column(length = 11)
  protected String ssn;
}

@Entity
class LoginEvent {
  @Id
  Long id;

  String ipAddress;
}

@Document(collection = "members")
class Member {
  String id;
  private String emailAddress;
}
