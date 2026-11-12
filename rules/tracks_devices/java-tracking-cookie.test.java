// lexcode-expect: 5
// Cookies whose names mark them as analytics, advertising or visitor-identifier cookies.
package demo.web;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.net.HttpCookie;
import org.springframework.http.ResponseCookie;

public class VisitorCookies {
  void write(HttpServletResponse response, String clientId) {
    Cookie ga = new Cookie("_ga", clientId);
    ga.setMaxAge(63072000);
    response.addCookie(ga);

    response.addCookie(new Cookie("_fbp", "fb.1.1700000000.123"));
    response.addCookie(new Cookie("visitor_id", clientId));
  }

  ResponseCookie spring(String id) {
    return ResponseCookie.from("tracking_id", id).maxAge(31536000).path("/").build();
  }

  HttpCookie legacy(String id) {
    return new HttpCookie("ajs_anonymous_id", id);
  }
}
