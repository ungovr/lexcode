// lexcode-expect: 0
// Play Core and in-app code that does not tie the app to a Google Play listing: reading the update
// info an injected manager already holds, a fake manager for tests, the split install manager for
// dynamic features, and an installed-app updater of the project's own.
package demo.update

import android.content.Context
import com.google.android.play.core.appupdate.AppUpdateManager
import com.google.android.play.core.appupdate.testing.FakeAppUpdateManager
import com.google.android.play.core.review.ReviewInfo
import com.google.android.play.core.splitinstall.SplitInstallManagerFactory

class UpdateChecker(private val manager: AppUpdateManager) {
    fun check() {
        manager.appUpdateInfo.addOnSuccessListener { info -> println(info.availableVersionCode()) }
    }

    fun fake(context: Context): FakeAppUpdateManager = FakeAppUpdateManager(context)

    fun split(context: Context) = SplitInstallManagerFactory.create(context)

    fun reviewShown(info: ReviewInfo?) = info != null
}
