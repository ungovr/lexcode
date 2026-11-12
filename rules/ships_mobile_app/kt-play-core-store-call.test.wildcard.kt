// lexcode-expect: 2
// The same factories reached through wildcard imports.
package org.example.fieldnotes.update.wild

import android.content.Context
import com.google.android.play.core.appupdate.*
import com.google.android.play.core.review.*

class WildHooks(private val context: Context) {
    fun updates() = AppUpdateManagerFactory.create(context)

    fun rate() = ReviewManagerFactory.create(context)
}
