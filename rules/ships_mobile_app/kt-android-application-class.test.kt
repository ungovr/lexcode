// lexcode-expect: 6
// The Application subclasses of Android apps: a plain one with and without a body, one with a
// primary constructor, an abstract base with a second supertype, a MultiDex one, and a Dagger one.
package org.example.fieldnotes

import android.app.Application
import androidx.multidex.MultiDexApplication
import dagger.android.DaggerApplication

@HiltAndroidApp
class FieldNotesApp : Application()

class Tracking : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}

class Booted(val flavor: String) : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}

abstract class AppManager : Application(), Configuration.Provider {
    abstract fun config(): Configuration
}

class Legacy(val flavor: String) : MultiDexApplication() {
    override fun onCreate() {
        super.onCreate()
    }
}

class Injected : DaggerApplication() {
    override fun applicationInjector() = null
}
