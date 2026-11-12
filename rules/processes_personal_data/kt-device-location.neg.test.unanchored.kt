// lexcode-expect: 0
// Classes of the app's own with the vendors' method names, in a file that imports no location type.
package demo.fleet

class FakeProvider {
    val lastLocation: String = "n/a"
    fun getLastLocation(): String = lastLocation
    fun getCurrentLocation(priority: Int): String = "n/a"
    fun requestLocationUpdates(callback: () -> Unit) = callback()
    fun getLastKnownLocation(provider: String): String = provider
    fun requestSingleUpdate(provider: String) = provider
}

class Dispatcher(private val provider: FakeProvider) {
    fun run() {
        provider.lastLocation
        provider.getLastLocation()
        provider.getCurrentLocation(1)
        provider.requestLocationUpdates { }
        provider.getLastKnownLocation("gps")
        provider.requestSingleUpdate("gps")
    }
}
