// lexcode-expect: 0
// Wildcard imports of the Deeplearning4j packages with fit on classes that are not networks: a
// project's own Layout and Window, one typed and one built in the function. A wildcard binds no
// class name, so only the names the rule lists can match.
package demo.scoring.wild

import org.deeplearning4j.nn.multilayer.*
import org.nd4j.autodiff.samediff.*

class Layout {
    fun fit(width: Int, height: Int) {}
}

class Window {
    fun fit(text: String) {}
}

class Panel(private val layout: Layout) {
    fun resize(width: Int, height: Int) {
        layout.fit(width, height)
        val w = Window()
        w.fit("title")
    }
}
