// lexcode-expect: 4
// Request and persistent objects that validate an email address a person supplies.
package demo.web;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class SignupForm {
  @NotBlank
  @Email
  private String email;

  @Email(message = "enter a valid address")
  private String backupContact;
}

class InviteRequest {
  @Email(regexp = ".+@.+\\..+")
  String friend;
}

record ContactRequest(@NotBlank String name, @Email String replyTo) {
}
