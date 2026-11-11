// lexcode-expect: 0
// A project's own base classes called Application, MultiDexApplication and DaggerApplication in
// the same package, with no Android import: they are not the Android ones.
package demo.plugins

open class Application
open class MultiDexApplication
open class DaggerApplication

class Host : Application()

class Legacy(val name: String) : MultiDexApplication() {
    fun run() {}
}

class Injected : DaggerApplication() {
    fun run() {}
}
