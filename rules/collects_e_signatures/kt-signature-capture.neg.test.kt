// lexcode-expect: 0
// Reading a bitmap from a drawing surface that is not a signature pad: a paint canvas, a view
// screenshot, and a project view that has signatureBitmap, transparentSignatureBitmap and
// signatureSvg members of its own. The library guards are tested too: this file imports neither
// the SignaturePad nor the SignatureView class, and calls their member names on a project label.
package demo.draw

import android.graphics.Bitmap
import android.view.View
import androidx.core.view.drawToBitmap
import demo.ui.SignatureLabel

class Painting {
  fun capture(view: View): Bitmap = view.drawToBitmap()

  fun paint(surface: PaintSurface): Bitmap = surface.bitmap

  fun label(label: SignatureLabel): Bitmap = label.signatureBitmap

  fun labelWithAlpha(label: SignatureLabel): Bitmap = label.transparentSignatureBitmap

  fun labelVector(label: SignatureLabel): String = label.signatureSvg

  fun labelGetters(label: SignatureLabel): Bitmap {
    label.getSignatureSvg()
    label.getTransparentSignatureBitmap(0)
    return label.getSignatureBitmap()
  }

  interface PaintSurface {
    val bitmap: Bitmap
  }
}
