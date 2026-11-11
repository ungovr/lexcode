// lexcode-expect: 2
// The Android class written out in full, with no import.
package org.example.fieldnotes.full

class FullApp : android.app.Application() {
    override fun onCreate() {
        super.onCreate()
    }
}

class FullAppTwo(val flavor: String) : android.app.Application()
