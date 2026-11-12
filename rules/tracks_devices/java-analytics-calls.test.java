// lexcode-expect: 29
// Android and server code that sends visits or events to a third-party analytics, attribution
// or crash service that follows the device with its own id.
package demo.metrics;

import android.app.Application;
import android.os.Bundle;
import com.adjust.sdk.AdjustConfig;
import com.amplitude.android.Amplitude;
import com.appsflyer.AppsFlyerLib;
import com.bugsnag.android.Bugsnag;
import com.facebook.appevents.AppEventsLogger;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.mixpanel.android.mpmetrics.MixpanelAPI;
import com.segment.analytics.Analytics;
import com.segment.analytics.messages.IdentifyMessage;
import com.segment.analytics.messages.PageMessage;
import com.segment.analytics.messages.ScreenMessage;
import com.segment.analytics.messages.TrackMessage;
import io.sentry.android.core.SentryAndroid;

public class App extends Application {
  private FirebaseAnalytics firebase;

  @Override
  public void onCreate() {
    super.onCreate();
    firebase = FirebaseAnalytics.getInstance(this);
    firebase.setUserId("u-1");
    SentryAndroid.init(this, options -> options.setDsn("https://key@example.ingest.sentry.io/1"));
    FirebaseCrashlytics.getInstance().setUserId("u-1");
    MixpanelAPI mixpanel = MixpanelAPI.getInstance(this, "token", true);
    mixpanel.track("Opened");
    Analytics segment = Analytics.with(this);
    segment.track("Opened");
    segment.identify("u-1");
    segment.screen("Home");
    Analytics built = new Analytics.Builder(this, "write-key").build();
    Bugsnag.start(this);
    firebase.setUserProperty("plan", "pro");
    FirebaseCrashlytics crash = FirebaseCrashlytics.getInstance();
    crash.setUserId("u-1");
  }

  void purchase(Bundle details) {
    firebase.logEvent(FirebaseAnalytics.Event.PURCHASE, details);
    AppEventsLogger.newLogger(this).logPurchase(null, null);
  }

  void later() {
    Amplitude amplitude = new Amplitude(null);
    amplitude.track("Later");
    amplitude.logEvent("Later");
  }
}

class MeasurementProtocol {
  // A server posting hits to Google Analytics.
  static final String ENDPOINT = "https://www.google-analytics.com/mp/collect?measurement_id=G-XXXX&api_secret=s";
}

class Attribution {
  void init(Application app) {
    AppsFlyerLib.getInstance().init("dev-key", null, app);
    AppsFlyerLib.getInstance().start(app);
    AdjustConfig config = new AdjustConfig(app, "app-token", AdjustConfig.ENVIRONMENT_PRODUCTION);
  }
}

class ServerSide {
  void signedUp(com.segment.analytics.Analytics analytics, String userId) {
    analytics.enqueue(TrackMessage.builder("Signed Up").userId(userId));
    analytics.enqueue(IdentifyMessage.builder().userId(userId));
    analytics.enqueue(ScreenMessage.builder("Home").userId(userId));
    analytics.enqueue(PageMessage.builder("Pricing").userId(userId));
    Analytics.builder("write-key").build();
    new MixpanelAPI("https://api.mixpanel.com/track", "https://api.mixpanel.com/engage");
  }
}
