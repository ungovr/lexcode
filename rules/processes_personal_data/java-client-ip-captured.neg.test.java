// lexcode-expect: 0
// The address is compared, counted in memory or left out of the record.
package demo.web;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class OfficeOnlyFilter {
  private static final Logger log = LoggerFactory.getLogger(OfficeOnlyFilter.class);
  private static final Set<String> ALLOWED = Set.of("10.0.0.5", "10.0.0.6");
  private final Map<String, Integer> hits = new ConcurrentHashMap<>();

  // The address is compared and discarded.
  boolean allowed(HttpServletRequest request) {
    boolean ok = ALLOWED.contains(request.getRemoteAddr());
    log.debug("office check on {}", request.getRequestURI());
    return ok;
  }

  // A rate-limit key held in memory, never written anywhere.
  boolean underLimit(HttpServletRequest request, int limit) {
    int count = hits.merge(request.getRemoteAddr(), 1, Integer::sum);
    return count <= limit;
  }

  // Forwarded protocol and the server's own address are not the person's address.
  void describe(HttpServletRequest request) {
    String proto = request.getHeader("X-Forwarded-Proto");
    log.info("proto {} served by {}", proto, request.getLocalAddr());
  }

  // The address only decides a yes or no, and the yes or no is logged.
  void diagnostics(HttpServletRequest request) {
    log.debug("diagnostics: hasRemoteAddr={}",
        request.getRemoteAddr() != null && !request.getRemoteAddr().isEmpty());
  }

  // The address goes to a verification call, and the verdict's message is logged.
  void captcha(HttpServletRequest request, CaptchaClient captcha, String answer) {
    CaptchaResult result = captcha.checkAnswer(request.getRemoteAddr(), answer);
    if (!result.isValid()) {
      log.warn("captcha failed: {}", result.getErrorMessage());
    }
  }

  // A literal bind address and loopback probe.
  void start() {
    log.info("listening on {}", "0.0.0.0");
    log.info("probe from 127.0.0.1");
  }
}

// A plain object that carries the address to a check and is then dropped: nothing is saved.
class QuizParticipant {
  private String accessCode;
  private String ipAddress;

  void setAccessCode(String accessCode) {
    this.accessCode = accessCode;
  }

  void setIpAddress(String ipAddress) {
    this.ipAddress = ipAddress;
  }
}

class QuizGate {
  boolean eligible(HttpServletRequest request, String code) {
    QuizParticipant participant = new QuizParticipant();
    participant.setAccessCode(code);
    participant.setIpAddress(request.getRemoteAddr());
    return participant != null && code != null;
  }
}

interface CaptchaClient {
  CaptchaResult checkAnswer(String remoteAddress, String answer);
}

interface CaptchaResult {
  boolean isValid();

  String getErrorMessage();
}
