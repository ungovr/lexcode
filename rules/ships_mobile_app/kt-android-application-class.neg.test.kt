// lexcode-expect: 0
// Android code that is not an app's own Application subclass: a library module's service,
// fragment and ViewModel (a library holds no Application), a helper that only reads one, and a
// class that has Application only as a type.
package demo.fieldnotes.sync

import android.app.Activity
import android.app.Application
import android.app.Service
import android.content.ContextWrapper
import android.content.Intent
import android.os.IBinder
import androidx.fragment.app.Fragment
import androidx.lifecycle.AndroidViewModel

class SyncService : Service() {
    override fun onBind(intent: Intent?): IBinder? = null
}

class NotesFragment : Fragment()

class NotesViewModel(application: Application) : AndroidViewModel(application)

class NotesActivity : Activity() {
    val app: Application get() = application
}

class Wrapper(private val app: Application) : ContextWrapper(app)

class Helper {
    fun name(app: Application): String = app.packageName
}
