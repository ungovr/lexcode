// lexcode-expect: 0
// Android storage that is not encrypted by a library the app bundles: plain SharedPreferences,
// the platform's own Keystore used to look up a key, a Room database built with no passphrase
// factory, and project classes that share the names of the encrypted-storage APIs. The guards are
// tested too: this file imports only a neighbor class of each library's package
// (androidx.security.crypto.MasterKey, which no guard names) and calls EncryptedSharedPreferences,
// EncryptedFile, SupportFactory and SupportOpenHelperFactory on classes of the project's own.
package demo.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.room.Room
import androidx.security.crypto.MasterKey
import demo.db.SupportFactory
import demo.db.SupportOpenHelperFactory
import demo.files.EncryptedFile
import demo.files.EncryptedFileNames
import demo.prefs.EncryptedSharedPreferences
import java.io.File
import java.security.KeyStore

class PlainStorage(private val context: Context) {
  fun prefs(): SharedPreferences = context.getSharedPreferences("settings", Context.MODE_PRIVATE)

  fun trustStore(): KeyStore {
    val keyStore = KeyStore.getInstance("AndroidKeyStore")
    keyStore.load(null)
    return keyStore
  }

  fun database(): Any = Room.databaseBuilder(context, Any::class.java, "app.db").build()

  fun ownPrefs(): Any = EncryptedSharedPreferences.create(context, "settings")

  fun ownFile(target: File): Any = EncryptedFile.Builder(context, target).build()

  fun ownFactory(passphrase: ByteArray): Any = SupportFactory(passphrase)

  fun ownHelperFactory(passphrase: ByteArray): Any = SupportOpenHelperFactory(passphrase)

  fun folder(): File = File(context.filesDir, EncryptedFileNames.FOLDER)

  fun keyOnly(): MasterKey? = null
}
