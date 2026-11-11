// lexcode-expect: 0
// Request objects that validate other things, and email text that is not an address field.
package demo.web;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ContactTopicForm {
  @NotBlank
  private String subject;

  @Size(max = 2000)
  private String message;

  // Named like an address, validated as free text only.
  @NotBlank
  private String emailSubject;
}

record NewsletterTemplate(@NotBlank String emailBody, @Size(max = 80) String title) {
}

class Mailer {
  // A method named email and a parameter, with no validation annotation at all.
  String email(String address) {
    return "To: " + address;
  }
}
