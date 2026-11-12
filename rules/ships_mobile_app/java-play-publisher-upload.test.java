// lexcode-expect: 4
// Releasing an Android build through the Google Play Developer API: upload a bundle and an APK
// into an edit, point a track at the new version, and commit the edit.
package demo.release;

import com.google.api.client.http.FileContent;
import com.google.api.services.androidpublisher.AndroidPublisher;
import com.google.api.services.androidpublisher.model.AppEdit;
import com.google.api.services.androidpublisher.model.Bundle;
import com.google.api.services.androidpublisher.model.Apk;
import com.google.api.services.androidpublisher.model.Track;
import com.google.api.services.androidpublisher.model.TrackRelease;
import java.io.File;
import java.io.IOException;
import java.util.List;

public class PlayRelease {
  private final AndroidPublisher publisher;
  private final String packageName;

  public PlayRelease(AndroidPublisher publisher, String packageName) {
    this.publisher = publisher;
    this.packageName = packageName;
  }

  public void publishBundle(File aab) throws IOException {
    AndroidPublisher.Edits edits = publisher.edits();
    AppEdit edit = edits.insert(packageName, null).execute();
    Bundle bundle = edits.bundles().upload(packageName, edit.getId(), new FileContent("application/octet-stream", aab)).execute();
    TrackRelease release = new TrackRelease().setVersionCodes(List.of(bundle.getVersionCode().longValue())).setStatus("completed");
    edits.tracks().update(packageName, edit.getId(), "production", new Track().setReleases(List.of(release))).execute();
    edits.commit(packageName, edit.getId()).execute();
  }

  public void publishApk(String editId, File apk) throws IOException {
    Apk uploaded = publisher.edits().apks().upload(packageName, editId, new FileContent("application/vnd.android.package-archive", apk)).execute();
    publisher.edits().tracks().update(packageName, editId, "beta", new Track().setReleases(List.of(new TrackRelease().setVersionCodes(List.of(uploaded.getVersionCode().longValue()))))).execute();
  }
}
