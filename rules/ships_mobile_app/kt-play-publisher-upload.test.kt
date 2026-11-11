// lexcode-expect: 4
// A release tool that pushes a build to Google Play through the Developer API: it opens an edit,
// uploads the bundle and an APK, and moves the production track to the new version.
package org.example.release

import com.google.api.services.androidpublisher.AndroidPublisher
import com.google.api.services.androidpublisher.model.Track
import com.google.api.services.androidpublisher.model.TrackRelease
import com.google.api.client.http.FileContent
import java.io.File

class PlayRelease(private val publisher: AndroidPublisher, private val packageName: String) {
    fun release(bundle: File, apk: File) {
        val edit = publisher.edits().insert(packageName, null).execute()
        val edits = publisher.edits()

        val uploaded = publisher.edits().bundles().upload(packageName, edit.id, FileContent("application/octet-stream", bundle)).execute()
        edits.apks().upload(packageName, edit.id, FileContent("application/vnd.android.package-archive", apk)).execute()

        val release = TrackRelease().setVersionCodes(listOf(uploaded.versionCode.toLong())).setStatus("completed")
        val track = Track().setReleases(listOf(release))
        edits.tracks().update(packageName, edit.id, "production", track).execute()
        publisher.edits().tracks().update(packageName, edit.id, "internal", track).execute()
        edits.commit(packageName, edit.id).execute()
    }
}
