// lexcode-expect: 0
// Android storage that is not encrypted by the app: plain SharedPreferences, the platform's
// KeyStore used to look up a certificate, a Room database built with no passphrase factory, a
// project class whose name only sounds like the encrypted-file API, and project classes that share
// the names of the encrypted-storage APIs (SupportFactory, SupportOpenHelperFactory,
// EncryptedSharedPreferences, EncryptedFile) with no import of the library. The guards are tested
// too: this file imports only a neighbor class of Jetpack Security (androidx.security.crypto.MasterKey,
// which no guard names).
package demo.storage;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.room.Room;
import androidx.security.crypto.MasterKey;
import java.io.File;
import java.security.KeyStore;
import demo.db.SupportFactory;
import demo.db.SupportOpenHelperFactory;
import demo.files.EncryptedFile;
import demo.files.EncryptedFileNames;
import demo.prefs.EncryptedSharedPreferences;

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

  public Object ownHelperFactory(byte[] passphrase) {
    return new SupportOpenHelperFactory(passphrase);
  }

  public Object ownPrefs() {
    return EncryptedSharedPreferences.create(context, "settings");
  }

  public Object ownFile(File target) {
    return new EncryptedFile.Builder(context, target).build();
  }

  public File folder() {
    return new File(context.getFilesDir(), EncryptedFileNames.FOLDER);
  }

  public MasterKey keyOnly() {
    return null;
  }
}
