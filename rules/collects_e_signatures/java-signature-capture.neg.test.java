// lexcode-expect: 0
// Reading a bitmap from a drawing surface that is not a signature pad: a paint canvas, a view
// screenshot, and a project view that has a getSignatureBitmap method of its own.
package demo.draw;

import android.graphics.Bitmap;
import android.view.View;
import demo.ui.SignatureLabel;

public class Painting {
  public Bitmap capture(View view) {
    view.setDrawingCacheEnabled(true);
    return Bitmap.createBitmap(view.getDrawingCache());
  }

  public Bitmap paint(PaintSurface surface) {
    return surface.getBitmap();
  }

  public Bitmap label(SignatureLabel label) {
    return label.getSignatureBitmap();
  }

  interface PaintSurface {
    Bitmap getBitmap();
  }
}
