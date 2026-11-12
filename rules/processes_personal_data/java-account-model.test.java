// lexcode-expect: 6
// Sign-in and user accounts: a user record Spring Security can authenticate, a user lookup,
// a stored-user manager, and the form and social login configuration.
package demo.security;

import java.io.Serializable;
import java.util.Collection;
import javax.sql.DataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.provisioning.JdbcUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

public class Account implements UserDetails {
  private String username;
  private String password;

  public String getUsername() {
    return username;
  }

  public String getPassword() {
    return password;
  }

  public Collection<? extends GrantedAuthority> getAuthorities() {
    return java.util.List.of();
  }
}

class Member implements Serializable, UserDetails {
  public String getUsername() {
    return "member";
  }

  public String getPassword() {
    return "";
  }

  public Collection<? extends GrantedAuthority> getAuthorities() {
    return java.util.List.of();
  }
}

class AccountLookup implements UserDetailsService {
  public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
    throw new UsernameNotFoundException(username);
  }
}

class WebSecurity {
  @Bean
  SecurityFilterChain site(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth.anyRequest().authenticated()).formLogin(Customizer.withDefaults());
    return http.build();
  }

  @Bean
  SecurityFilterChain social(HttpSecurity http) throws Exception {
    http.oauth2Login(Customizer.withDefaults());
    return http.build();
  }

  @Bean
  JdbcUserDetailsManager users(DataSource dataSource) {
    return new JdbcUserDetailsManager(dataSource);
  }
}
