// lexcode-expect: 5
// Android data encrypted at rest by the app with a library it bundles: Jetpack Security's
// EncryptedSharedPreferences (the older and the newer create signature) and EncryptedFile, and a
// SQLCipher-backed Room database (the classic and the Zetetic package).
package demo.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.room.Room
import androidx.security.crypto.EncryptedFile
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import androidx.security.crypto.MasterKeys
import java.io.File
import net.sqlcipher.database.SupportFactory
import net.zetetic.database.sqlcipher.SupportOpenHelperFactory

class SecureStorage(private val context: Context) {
  fun prefs(key: MasterKey): SharedPreferences =
      EncryptedSharedPreferences.create(
          context,
          "secrets",
          key,
          EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
          EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)

  fun oldPrefs(): SharedPreferences {
    val masterKey = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
    return EncryptedSharedPreferences.create(
        "secrets",
        masterKey,
        context,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM)
  }

  fun file(key: MasterKey, target: File): EncryptedFile =
      EncryptedFile.Builder(context, target, key, EncryptedFile.FileEncryptionScheme.AES256_GCM_HKDF_4KB).build()

  fun database(passphrase: ByteArray): Any {
    val factory = SupportFactory(passphrase)
    return Room.databaseBuilder(context, Any::class.java, "vault.db").openHelperFactory(factory).build()
  }

  fun zeteticDatabase(passphrase: ByteArray): Any {
    val factory = SupportOpenHelperFactory(passphrase)
    return Room.databaseBuilder(context, Any::class.java, "vault2.db").openHelperFactory(factory).build()
  }
}
