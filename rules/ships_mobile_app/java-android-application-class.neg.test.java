// lexcode-expect: 0
// Android code that is not an app's own Application subclass: a library module's service,
// fragment and ViewModel (a library holds no Application), and a helper that only reads one.
package demo.fieldnotes.sync;

import android.app.Service;
import android.content.Intent;
import android.os.IBinder;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.AndroidViewModel;
import android.app.Application;

public class SyncService extends Service {
  @Nullable
  @Override
  public IBinder onBind(Intent intent) {
    return null;
  }
}

class NotesFragment extends Fragment {}

class NotesViewModel extends AndroidViewModel {
  NotesViewModel(Application application) {
    super(application);
  }
}

class Helper {
  String name(Application application) {
    return application.getPackageName();
  }
}
