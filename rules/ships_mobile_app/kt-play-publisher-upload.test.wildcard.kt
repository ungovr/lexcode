// lexcode-expect: 2
// The same upload with a wildcard import of the Developer API package, and a nested-class import.
package org.example.release.wild

import com.google.api.services.androidpublisher.*

class WildRelease(private val edits: AndroidPublisher.Edits) {
    fun release(packageName: String, editId: String, content: com.google.api.client.http.AbstractInputStreamContent) {
        edits.bundles().upload(packageName, editId, content).execute()
        edits.apks().upload(packageName, editId, content).execute()
    }
}
