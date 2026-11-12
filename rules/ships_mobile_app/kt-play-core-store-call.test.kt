// lexcode-expect: 2
// An app that asks Google Play whether a newer release is available and, after a while, asks the
// store to show the rating prompt. Both exist only for an app installed from Google Play.
package org.example.fieldnotes.update

import android.content.Context
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.AppUpdateManagerFactory
import com.google.android.play.core.review.ReviewManagerFactory

class StoreHooks(private val context: Context) {
    fun updates(): AppUpdateManager {
        return AppUpdateManagerFactory.create(context)
    }

    fun rate() {
        val manager = ReviewManagerFactory.create(context)
        manager.requestReviewFlow()
    }
}
