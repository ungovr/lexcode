// lexcode-expect: 0
// A file that imports one Deeplearning4j class and has a MultiLayerNetwork of its own: its fit is not
// Deeplearning4j's, because the class it calls is not the class the file imports. The receiver is
// typed, built in the function and built in the class, so each declaration shape is covered.
package demo.sim

import org.deeplearning4j.nn.graph.ComputationGraph

class MultiLayerNetwork {
    fun fit(x: Int) {}
}

class Runner(private val net: MultiLayerNetwork) {
    private val built = MultiLayerNetwork()

    fun run(graph: ComputationGraph) {
        net.fit(1)
        built.fit(2)
        val local = MultiLayerNetwork()
        local.fit(3)
        MultiLayerNetwork().fit(4)
    }
}
