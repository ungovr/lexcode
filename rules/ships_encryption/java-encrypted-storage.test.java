// lexcode-expect: 3
// Android data encrypted at rest by the app: Jetpack Security's EncryptedSharedPreferences and
// EncryptedFile, and a SQLCipher-backed Room database.
package demo.storage;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.room.Room;
import androidx.security.crypto.EncryptedFile;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import java.io.File;
import net.sqlcipher.database.SupportFactory;

public class SecureStorage {
  private final Context context;

  public SecureStorage(Context context) {
    this.context = context;
  }

  public SharedPreferences prefs(MasterKey key) throws Exception {
    return EncryptedSharedPreferences.create(
        context,
        "secrets",
        key,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM);
  }

  public EncryptedFile file(MasterKey key, File target) throws Exception {
    return new EncryptedFile.Builder(
            context, target, key, EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB)
        .build();
  }

  public Object database(byte[] passphrase) {
    SupportFactory factory = new SupportFactory(passphrase);
    return Room.databaseBuilder(context, Object.class, "vault.db").openHelperFactory(factory).build();
  }
}
