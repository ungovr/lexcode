// lexcode-expect: 0
// Android storage that is not encrypted by the app: plain SharedPreferences, the platform's
// KeyStore used to look up a certificate, a Room database built with no passphrase factory, a
// project class whose name only sounds like the encrypted-file API, and a project SupportFactory
// (the name SQLCipher's factory has) with no SQLCipher import.
package demo.storage;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.room.Room;
import java.io.File;
import java.security.KeyStore;
import demo.db.SupportFactory;
import demo.files.EncryptedFileNames;

public class PlainStorage {
  private final Context context;

  public PlainStorage(Context context) {
    this.context = context;
  }

  public SharedPreferences prefs() {
    return context.getSharedPreferences("settings", Context.MODE_PRIVATE);
  }

  public KeyStore trustStore() throws Exception {
    KeyStore keyStore = KeyStore.getInstance("AndroidKeyStore");
    keyStore.load(null);
    return keyStore;
  }

  public Object database() {
    return Room.databaseBuilder(context, Object.class, "app.db").build();
  }

  public Object ownFactory(byte[] passphrase) {
    return new SupportFactory(passphrase);
  }

  public File folder() {
    return new File(context.getFilesDir(), EncryptedFileNames.FOLDER);
  }
}
