// lexcode-expect: 0
// Authentication that is not a person's account, and lookalikes.
package demo.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class StagingSecurity {
  // One shared credential for a staging banner, not a user account.
  @Bean
  SecurityFilterChain staging(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated());
    http.httpBasic(Customizer.withDefaults());
    return http.build();
  }

  // A machine client presenting a signed token: there is no sign-in and no user record.
  @Bean
  SecurityFilterChain api(HttpSecurity http) throws Exception {
    http.oauth2ResourceServer(rs -> rs.jwt(Customizer.withDefaults()));
    return http.build();
  }
}

// A name that mentions the word but implements nothing from Spring Security.
class UserDetailsFormatter {
  String format(String name) {
    return name.trim();
  }

  Object formLogin() {
    return null;
  }
}

class PasswordPolicy {
  static final int MINIMUM = 12;

  boolean secure(String password) {
    return password.length() >= MINIMUM;
  }
}
