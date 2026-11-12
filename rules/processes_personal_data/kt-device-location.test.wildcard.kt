// lexcode-expect: 2
// The same reads through wildcard imports of the location packages.
package demo.location

import android.location.*
import com.google.android.gms.location.*

class WildTracker(private val fused: FusedLocationProviderClient, private val manager: LocationManager) {
    fun last() {
        fused.getLastLocation()
    }

    fun known() {
        manager.getLastKnownLocation(LocationManager.GPS_PROVIDER)
    }
}
