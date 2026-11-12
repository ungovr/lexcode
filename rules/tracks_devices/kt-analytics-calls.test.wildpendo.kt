// lexcode-expect: 1
// Pendo's mobile SDK through a wildcard import of its package.
package demo.android

import sdk.pendo.io.*

class WildPendo {
    fun send(name: String) {
        Pendo.track(name, emptyMap())
    }
}
