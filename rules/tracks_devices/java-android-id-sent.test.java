// lexcode-expect: 11
// The Android id read and sent off the device: in an HTTP header, on a form, in a query string,
// and to an analytics or crash SDK as the user id.
package demo.android;

import android.app.Activity;
import android.net.Uri;
import android.provider.Settings;
import android.provider.Settings.Secure;
import com.appsflyer.AppsFlyerLib;
import com.google.firebase.analytics.FirebaseAnalytics;
import com.google.firebase.crashlytics.FirebaseCrashlytics;
import com.mixpanel.android.mpmetrics.MixpanelAPI;
import java.net.HttpURLConnection;
import okhttp3.FormBody;
import okhttp3.HttpUrl;
import okhttp3.Request;

public class UploadActivity extends Activity {
  Request header() {
    String id = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    return new Request.Builder().url("https://api.example.com/v1/ping").addHeader("X-Device", id).build();
  }

  void legacy(HttpURLConnection connection) {
    String id = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    connection.setRequestProperty("X-Device", id);
  }

  FormBody form() {
    String id = Secure.getString(getContentResolver(), Secure.ANDROID_ID);
    return new FormBody.Builder().add("device", id).build();
  }

  Uri query() {
    String id = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    return Uri.parse("https://api.example.com/ping").buildUpon().appendQueryParameter("device", id).build();
  }

  void sdk(FirebaseAnalytics analytics) {
    analytics.setUserId(Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID));
  }

  void body(okhttp3.OkHttpClient client) {
    String id = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    Request request = new Request.Builder().url("https://api.example.com/v1/register").header("Authorization", id).build();
  }

  void more(FirebaseCrashlytics crash, MixpanelAPI mixpanel) {
    String id = Settings.Secure.getString(getContentResolver(), Settings.Secure.ANDROID_ID);
    crash.setUserId(id);
    mixpanel.identify(id);
    AppsFlyerLib.getInstance().setCustomerUserId(id);
    HttpUrl url = HttpUrl.parse("https://api.example.com/ping").newBuilder().addQueryParameter("device", id).build();
    FormBody encoded = new FormBody.Builder().addEncoded("device", id).build();
  }
}
