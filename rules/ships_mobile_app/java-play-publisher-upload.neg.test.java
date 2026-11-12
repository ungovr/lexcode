// lexcode-expect: 0
// The Google Play Developer API used for things other than releasing a build: checking that a
// purchase token is valid, answering a review, and reading the state of a track. Reading an
// edit and discarding it publishes nothing. The look-alike is an asset store with its own
// bundles and tracks.
package demo.billing;

import com.google.api.services.androidpublisher.AndroidPublisher;
import com.google.api.services.androidpublisher.model.ProductPurchase;
import com.google.api.services.androidpublisher.model.ReviewsReplyRequest;
import com.google.api.services.androidpublisher.model.Track;
import com.google.api.services.androidpublisher.model.AppEdit;
import java.io.IOException;

public class PlayChecks {
  private final AndroidPublisher publisher;
  private final String packageName;

  public PlayChecks(AndroidPublisher publisher, String packageName) {
    this.publisher = publisher;
    this.packageName = packageName;
  }

  public boolean purchaseIsValid(String productId, String token) throws IOException {
    ProductPurchase purchase = publisher.purchases().products().get(packageName, productId, token).execute();
    return purchase.getPurchaseState() == 0;
  }

  public void thank(String reviewId) throws IOException {
    ReviewsReplyRequest reply = new ReviewsReplyRequest().setReplyText("Thank you for the feedback.");
    publisher.reviews().reply(packageName, reviewId, reply).execute();
  }

  public String liveRelease() throws IOException {
    AppEdit edit = publisher.edits().insert(packageName, null).execute();
    Track track = publisher.edits().tracks().get(packageName, edit.getId(), "production").execute();
    publisher.edits().delete(packageName, edit.getId()).execute();
    return track.getReleases().get(0).getName();
  }
}

class AssetStore {
  Uploads bundles() {
    return new Uploads();
  }

  Uploads tracks() {
    return new Uploads();
  }
}

class Uploads {
  void upload(String name) {}

  void update(String name) {}
}

class Packager {
  void pack(AssetStore store) {
    store.bundles().upload("textures");
    store.tracks().update("audio");
  }
}
