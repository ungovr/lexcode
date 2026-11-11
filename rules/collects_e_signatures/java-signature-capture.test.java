// lexcode-expect: 3
// Reading back a signature a person drew on an Android signature pad: the bitmap and the
// SVG from the SignaturePad view, and the bitmap from a SignatureView.
package demo.sign;

import android.graphics.Bitmap;
import com.github.gcacace.signaturepad.views.SignaturePad;
import com.kyanogen.signatureview.SignatureView;

public class SignatureScreen {
  private SignaturePad pad;
  private SignatureView view;

  public Bitmap flatten() {
    return pad.getSignatureBitmap();
  }

  public String vector() {
    return pad.getSignatureSvg();
  }

  public Bitmap fromView() {
    return view.getSignatureBitmap();
  }
}
