// lexcode-expect: 2
// The factories called by their full package name, with no import.
package org.example.fieldnotes.update.full

import android.content.Context

class FullHooks(private val context: Context) {
    fun updates() = com.google.android.play.core.appupdate.AppUpdateManagerFactory.create(context)

    fun rate() = com.google.android.play.core.review.ReviewManagerFactory.create(context)
}
