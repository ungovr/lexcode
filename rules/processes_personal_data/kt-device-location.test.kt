// lexcode-expect: 7
// Reading a person's precise location on Android: the fused location client (last location, current
// location, location updates, and the chained form from LocationServices) and LocationManager.
package demo.location

import android.annotation.SuppressLint
import android.content.Context
import android.location.LocationManager
import android.os.Looper
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.Priority
import com.google.android.gms.tasks.CancellationTokenSource

@SuppressLint("MissingPermission")
class Tracker(private val context: Context, private val fused: FusedLocationProviderClient) {
    fun last() {
        fused.lastLocation.addOnSuccessListener { location -> println(location) }
    }

    fun chained() {
        LocationServices.getFusedLocationProviderClient(context).getLastLocation()
    }

    fun current() {
        fused.getCurrentLocation(Priority.PRIORITY_HIGH_ACCURACY, CancellationTokenSource().token)
    }

    fun updates(request: LocationRequest, callback: LocationCallback) {
        fused.requestLocationUpdates(request, callback, Looper.getMainLooper())
    }

    fun manager(locationManager: LocationManager) {
        locationManager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
        locationManager.requestLocationUpdates(LocationManager.GPS_PROVIDER, 1000L, 5f) { }
        locationManager.requestSingleUpdate(LocationManager.NETWORK_PROVIDER, { }, null)
    }
}
