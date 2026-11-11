// lexcode-expect: 3
// The Application subclass an Android app declares in its manifest, in its three common forms:
// a plain Application, a MultiDex application and a Dagger Android application.
package demo.fieldnotes;

import android.app.Application;
import androidx.multidex.MultiDexApplication;
import dagger.android.AndroidInjector;
import dagger.android.DaggerApplication;

public class FieldNotesApp extends Application {
  @Override
  public void onCreate() {
    super.onCreate();
  }
}

class LegacyApp extends MultiDexApplication {
  @Override
  public void onCreate() {
    super.onCreate();
  }
}

class InjectedApp extends DaggerApplication {
  @Override
  protected AndroidInjector<? extends DaggerApplication> applicationInjector() {
    return null;
  }
}
