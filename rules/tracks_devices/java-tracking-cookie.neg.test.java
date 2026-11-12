// lexcode-expect: 0
// Cookies a service needs to deliver the page: the session, a language choice, a theme, a
// CSRF token and a first-name greeting.
package demo.web;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseCookie;

public class SessionCookies {
  void write(HttpServletResponse response, String sessionId, String lang) {
    Cookie session = new Cookie("JSESSIONID", sessionId);
    session.setHttpOnly(true);
    response.addCookie(session);

    response.addCookie(new Cookie("lang", lang));
    response.addCookie(new Cookie("theme", "dark"));
    response.addCookie(new Cookie("XSRF-TOKEN", "abc"));
    response.addCookie(new Cookie("visitor_name", "Ada"));
  }

  ResponseCookie spring(String token) {
    return ResponseCookie.from("SESSION", token).httpOnly(true).path("/").build();
  }

  // A cookie name held in a variable the rule cannot read, and a cookie that is only read.
  void read(jakarta.servlet.http.HttpServletRequest request, String name) {
    Cookie[] all = request.getCookies();
    new Cookie(name, "x");
  }
}
