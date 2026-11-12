// lexcode-expect: 6
// Reading where the person is on Android: the fused client and the platform manager.
package demo.android;

import android.app.Activity;
import android.content.Context;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Looper;
import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

public class NearbyActivity extends Activity {
  private FusedLocationProviderClient fused;

  void start(LocationCallback callback, LocationRequest request) {
    fused = LocationServices.getFusedLocationProviderClient(this);
    fused.getLastLocation().addOnSuccessListener(location -> show(location));
    fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, null);
    fused.requestLocationUpdates(request, callback, Looper.getMainLooper());
  }

  @SuppressWarnings("MissingPermission")
  void legacy(LocationListener listener) {
    LocationManager manager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
    manager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000L, 10f, listener);
    show(manager.getLastKnownLocation(LocationManager.NETWORK_PROVIDER));
  }

  void once() {
    LocationServices.getFusedLocationProviderClient(this).getLastLocation();
  }

  void show(Object location) {}
}
