// lexcode-expect: 2
// The same calls with wildcard imports of the Deeplearning4j and ND4J packages.
package org.example.fieldnotes.train.wild

import org.deeplearning4j.nn.multilayer.*
import org.nd4j.autodiff.samediff.*

class WildTrainer(private val network: MultiLayerNetwork, private val model: SameDiff) {
    fun epoch(data: Any) {
        network.fit(data)
        model.fit(data, 3)
    }
}
