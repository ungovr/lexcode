// lexcode-expect: 0
// Security configuration that does not open a sign-up page to the public.
package demo.config;

import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

class SecurityConfig {

  @Bean
  SecurityFilterChain chain(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/login", "/css/**", "/health").permitAll()
        .requestMatchers("/admin/register").hasRole("ADMIN")
        .requestMatchers("/register").authenticated()
        .anyRequest().authenticated());
    return http.build();
  }

  @Bean
  SecurityFilterChain reversed(HttpSecurity http) throws Exception {
    http.authorizeHttpRequests(auth -> auth
        .requestMatchers("/register").hasRole("ADMIN")
        .requestMatchers("/signup").authenticated()
        .requestMatchers("/login", "/css/**").permitAll()
        .anyRequest().authenticated());
    return http.build();
  }
}
