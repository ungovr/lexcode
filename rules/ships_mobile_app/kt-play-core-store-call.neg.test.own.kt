// lexcode-expect: 0
// Factories of the project's own named AppUpdateManagerFactory and ReviewManagerFactory, in a file
// with no Play Core import: the class name alone is not Google Play.
package demo.selfupdate

object AppUpdateManagerFactory {
    fun create(context: Any): Any = Any()
}

object ReviewManagerFactory {
    fun create(context: Any): Any = Any()
}

class Updater(private val context: Any) {
    val manager = AppUpdateManagerFactory.create(context)
    val review = ReviewManagerFactory.create(context)
}
