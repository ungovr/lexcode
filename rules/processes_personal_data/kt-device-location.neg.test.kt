// lexcode-expect: 0
// A file that imports the location types but reads no position: whether a provider is on, the
// distance between two fixed points, and geocoding a typed address.
package demo.location

import android.location.Geocoder
import android.location.Location
import android.location.LocationManager
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices

class Availability(private val manager: LocationManager, private val geocoder: Geocoder) {
    fun gpsOn(): Boolean = manager.isProviderEnabled(LocationManager.GPS_PROVIDER)

    fun distance(): Float {
        val results = FloatArray(1)
        Location.distanceBetween(48.85, 2.35, 51.50, -0.12, results)
        return results[0]
    }

    @Suppress("DEPRECATION")
    fun lookup(address: String) = geocoder.getFromLocationName(address, 1)

    fun client(context: android.content.Context): FusedLocationProviderClient =
        LocationServices.getFusedLocationProviderClient(context)
}
