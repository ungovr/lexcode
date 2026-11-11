// lexcode-expect: 0
// A file that imports a different class from the Deeplearning4j multilayer package (Foo) and a
// MultiLayerNetwork from another vendor's package: the class it calls is imported from com.acme, so its
// fit is not Deeplearning4j's.
package demo.sim.acme

import com.acme.nn.MultiLayerNetwork
import org.deeplearning4j.nn.multilayer.Foo

class Runner(private val net: MultiLayerNetwork, private val foo: Foo) {
    fun run() {
        net.fit(1)
        val local = MultiLayerNetwork()
        local.fit(2)
    }
}
