// lexcode-expect: 4
// Security configuration that opens a sign-up page to anyone, signed in or not.
package demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.util.matcher.AntPathRequestMatcher;

class SecurityConfig {

  @Bean
  SecurityFilterChain chain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/register", "/css/**").permitAll()
        .requestMatchers(new AntPathRequestMatcher("/signup")).permitAll()
        .anyRequest().authenticated());
    return http.build();
  }

  void legacy(HttpSecurity http) throws Exception {
    http.authorizeRequests().antMatchers("/users/register", "/login").permitAll();
    http.authorizeRequests().mvcMatchers("/login", "/signup").permitAll();
  }
}
