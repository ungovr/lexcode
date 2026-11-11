// lexcode-expect: 1
// A Room database encrypted at rest with SQLCipher's Zetetic package.
package demo.storage;

import android.content.Context;
import androidx.room.Room;
import net.zetetic.database.sqlcipher.SupportOpenHelperFactory;

public class ZeteticStorage {
  private final Context context;

  public ZeteticStorage(Context context) {
    this.context = context;
  }

  public Object database(byte[] passphrase) {
    SupportOpenHelperFactory factory = new SupportOpenHelperFactory(passphrase);
    return Room.databaseBuilder(context, Object.class, "vault.db").openHelperFactory(factory).build();
  }
}
