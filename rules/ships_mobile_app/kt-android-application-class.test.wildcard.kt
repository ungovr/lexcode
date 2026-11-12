// lexcode-expect: 3
// The same classes with wildcard imports of the Android packages, and the support-library MultiDex
// import of older apps.
package org.example.fieldnotes.wild

import android.app.*
import android.support.multidex.MultiDexApplication
import dagger.android.*

class WildApp : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}

class OldApp : MultiDexApplication()

class WildInjected : DaggerApplication() {
    override fun applicationInjector() = null
}
