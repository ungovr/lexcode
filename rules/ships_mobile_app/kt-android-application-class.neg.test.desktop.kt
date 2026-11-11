// lexcode-expect: 0
// Classes named Application that are not the Android one: a JavaFX desktop application (the
// look-alike the import guard exists for), and a class of the project's own called Application
// in the same package with no import at all.
package demo.desktop

import javafx.application.Application
import javafx.stage.Stage

class Viewer : Application() {
    override fun start(stage: Stage) {
        stage.title = "Viewer"
        stage.show()
    }
}

class Launcher(val args: Array<String>) : Application() {
    override fun start(stage: Stage) {}
}
