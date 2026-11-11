// lexcode-expect: 0
// Location code that never reads where the person is: a provider check, a distance between two
// fixed points, a geocoded street address typed in, and a class with a method of the same name.
package demo.android;

import android.app.Activity;
import android.content.Context;
import android.location.Geocoder;
import android.location.Location;
import android.location.LocationManager;
import java.io.IOException;
import java.util.List;
import java.util.Locale;

public class StoreFinderActivity extends Activity {
  // Is the setting switched on? No position is read.
  boolean gpsSwitchedOn() {
    LocationManager manager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);
    return manager.isProviderEnabled(LocationManager.GPS_PROVIDER);
  }

  // Distance between two stores, both fixed.
  float distanceBetweenStores(double lat1, double lon1, double lat2, double lon2) {
    float[] result = new float[1];
    Location.distanceBetween(lat1, lon1, lat2, lon2, result);
    return result[0];
  }

  // A street address the person typed in, turned into coordinates.
  List<android.location.Address> find(String typedAddress) throws IOException {
    Geocoder geocoder = new Geocoder(this, Locale.US);
    return geocoder.getFromLocationName(typedAddress, 1);
  }
}

// A cache of the last place the app looked something up, with the same method names as the
// platform clients and no platform import behind it.
class SearchHistory {
  private String last;

  String getLastLocation() {
    return last;
  }

  void requestLocationUpdates(String query) {
    last = query;
  }

  String getLastKnownLocation() {
    return last;
  }
}

class HistoryScreen {
  String show(SearchHistory history) {
    history.requestLocationUpdates("coffee");
    return history.getLastLocation() + history.getLastKnownLocation();
  }
}
