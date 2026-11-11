// lexcode-expect: 0
// Error reporting, the app's own counters, other Firebase products and classes that share a
// vendor's method names without the vendor's SDK behind them.
package demo.metrics;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.firestore.FirebaseFirestore;
import com.google.firebase.messaging.FirebaseMessaging;
import io.micrometer.core.instrument.MeterRegistry;
import lombok.Builder;
import io.sentry.Sentry;

public class Telemetry {
  private final MeterRegistry registry;

  Telemetry(MeterRegistry registry) {
    this.registry = registry;
  }

  // Server-side error reporting and internal counters follow no visitor.
  void failed(Exception error, String path) {
    Sentry.captureException(error);
    registry.counter("requests.failed", "path", path).increment();
  }

  // Sign-in, database and push messaging from Firebase are not analytics.
  void firebaseOtherProducts() {
    FirebaseAuth auth = FirebaseAuth.getInstance();
    FirebaseFirestore store = FirebaseFirestore.getInstance();
    FirebaseMessaging.getInstance().subscribeToTopic("news");
    auth.signOut();
    store.clearPersistence();
  }
}

// The app's own audit trail, with the same method names a vendor SDK uses and no vendor behind it.
class Analytics {
  private int events;

  static Analytics with(Object context) {
    return new Analytics();
  }

  void track(String name) {
    events++;
  }

  void identify(String id) {
    events++;
  }

  void logEvent(String name) {
    events++;
  }
}

class AuditTrail {
  void logEvent(String name) {}

  void setUserId(String id) {}

  void send(String payload) {}
}

class Usage {
  void run(AuditTrail trail) {
    Analytics.with(this).track("jobs_run");
    trail.logEvent("export");
    trail.setUserId("batch");
  }
}

// App-owned Lombok builders that share the names of Segment's message classes.
@Builder
class TrackMessage {
  String name;
}

@Builder
class PageMessage {
  String title;
}

// An audio app's own value class named Amplitude, with methods named like the vendor's.
class Amplitude {
  private final double level;

  Amplitude(double level) {
    this.level = level;
  }

  void track(double next) {}

  void logEvent(String name) {}
}

class Mixer {
  void run() {
    TrackMessage.builder().name("intro").build();
    PageMessage.builder().title("home").build();
    Amplitude peak = new Amplitude(0.8);
    peak.track(0.9);
    peak.logEvent("clipped");
  }
}
