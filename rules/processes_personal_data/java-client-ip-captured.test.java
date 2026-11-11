// lexcode-expect: 6
// Filters and controllers that write the visitor's address into a log or a table.
package demo.web;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.jdbc.core.JdbcTemplate;

public class AccessAudit {
  private static final Logger log = LoggerFactory.getLogger(AccessAudit.class);
  private final JdbcTemplate jdbc;
  private final VisitRepository visits;

  AccessAudit(JdbcTemplate jdbc, VisitRepository visits) {
    this.jdbc = jdbc;
    this.visits = visits;
  }

  // A log line.
  void signIn(HttpServletRequest request, String user) {
    log.info("sign-in by {} from {}", user, request.getRemoteAddr());
  }

  // The proxy header, held in a local first.
  void forwarded(HttpServletRequest request) {
    String ip = request.getHeader("X-Forwarded-For");
    log.warn("forwarded for " + ip);
  }

  // A mapped diagnostic context entry goes to every log line.
  void tag(HttpServletRequest request) {
    MDC.put("client", request.getHeader("X-Real-IP"));
  }

  // A row written through JDBC.
  void record(HttpServletRequest request) {
    jdbc.update("INSERT INTO hits (path, ip) VALUES (?, ?)", request.getRequestURI(), request.getRemoteAddr());
  }

  // An entity that is saved in the same method.
  void visit(HttpServletRequest request) {
    Visit visit = new Visit();
    visit.setPath(request.getRequestURI());
    visit.setIpAddress(request.getRemoteAddr());
    visits.save(visit);
  }

  // A prepared statement that inserts.
  void insert(java.sql.Connection conn, HttpServletRequest request) throws java.sql.SQLException {
    try (java.sql.PreparedStatement ps = conn.prepareStatement("INSERT INTO logins (ip) VALUES (?)")) {
      ps.setString(1, request.getRemoteAddr());
      ps.executeUpdate();
    }
  }
}

class Visit {
  void setPath(String path) {}

  void setIpAddress(String ip) {}
}

interface VisitRepository {
  Visit save(Visit visit);
}
