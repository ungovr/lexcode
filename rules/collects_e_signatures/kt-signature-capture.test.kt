// lexcode-expect: 7
// Reading back a signature a person drew on an Android signature pad, as Kotlin writes the
// getters (properties) and as a Java-style call: the bitmap, the transparent bitmap and the SVG
// from the SignaturePad view, and the bitmap from a SignatureView.
package demo.sign

import android.graphics.Bitmap
import com.github.gcacace.signaturepad.views.SignaturePad
import com.kyanogen.signatureview.SignatureView

class SignatureScreen(private val pad: SignaturePad, private val view: SignatureView) {
  fun flatten(): Bitmap = pad.signatureBitmap

  fun withAlpha(): Bitmap = pad.transparentSignatureBitmap

  fun vector(): String = pad.signatureSvg

  fun fromView(): Bitmap = view.signatureBitmap

  fun javaStyle(): Bitmap = pad.getSignatureBitmap()

  fun javaStyleVector(): String = pad.getSignatureSvg()

  fun javaStyleAlpha(): Bitmap = pad.getTransparentSignatureBitmap(0)
}
