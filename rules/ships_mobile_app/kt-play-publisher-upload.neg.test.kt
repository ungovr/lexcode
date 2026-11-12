// lexcode-expect: 0
// The Google Play Developer API used for things other than releasing a build: checking that a
// purchase token is valid, answering a review, and reading the state of a track. Reading an
// edit and discarding it publishes nothing. (An asset store with its own bundles and tracks is the
// look-alike in the second negative file, which has no Google Play import.)
package demo.billing

import com.google.api.services.androidpublisher.AndroidPublisher
import com.google.api.services.androidpublisher.model.ReviewsReplyRequest

class PlayChecks(private val publisher: AndroidPublisher, private val packageName: String) {
    fun purchaseIsValid(productId: String, token: String): Boolean {
        val purchase = publisher.purchases().products().get(packageName, productId, token).execute()
        return purchase.purchaseState == 0
    }

    fun thank(reviewId: String) {
        val reply = ReviewsReplyRequest().setReplyText("Thank you for the feedback.")
        publisher.reviews().reply(packageName, reviewId, reply).execute()
    }

    fun liveRelease(): String {
        val edit = publisher.edits().insert(packageName, null).execute()
        val track = publisher.edits().tracks().get(packageName, edit.id, "production").execute()
        publisher.edits().bundles().list(packageName, edit.id).execute()
        publisher.edits().delete(packageName, edit.id).execute()
        return track.releases[0].name
    }
}
