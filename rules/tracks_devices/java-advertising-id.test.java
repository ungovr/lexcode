// lexcode-expect: 9
// Reading identifiers that follow one device: the advertising id, the handset
// and subscriber ids, the hardware serial and the installation id.
package demo.android;

import android.app.Activity;
import android.os.Build;
import android.telephony.TelephonyManager;
import com.google.android.gms.ads.identifier.AdvertisingIdClient;
import com.google.firebase.iid.FirebaseInstanceId;
import com.google.firebase.installations.FirebaseInstallations;

public class IdentityActivity extends Activity {
  void read() throws Exception {
    AdvertisingIdClient.Info info = AdvertisingIdClient.getAdvertisingIdInfo(getApplicationContext());
    String adId = info.getId();
    TelephonyManager phone = (TelephonyManager) getSystemService(TELEPHONY_SERVICE);
    String imei = phone.getImei();
    String legacyDeviceId = phone.getDeviceId();
    String subscriber = phone.getSubscriberId();
    String serial = Build.getSerial();
    String meid = phone.getMeid();
    String simSerial = phone.getSimSerialNumber();
    FirebaseInstanceId.getInstance().getId();
    FirebaseInstallations.getInstance().getId();
  }
}
