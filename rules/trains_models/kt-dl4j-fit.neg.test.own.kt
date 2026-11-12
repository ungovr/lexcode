// lexcode-expect: 0
// Classes of the project's own that share the names of Deeplearning4j's, in a file with no
// Deeplearning4j import: fit on them is not network training.
package demo.sim

class MultiLayerNetwork {
    fun fit(x: Int) {}
}

class ComputationGraph {
    fun fit(x: Int) {}
}

class SameDiff {
    fun fit(x: Int) {}
}

class EarlyStoppingTrainer {
    fun fit() {}
}

class SparkDl4jMultiLayer {
    fun fit(x: Int) {}
}

class Runner(private val net: MultiLayerNetwork, private val graph: ComputationGraph) {
    private val diff: SameDiff = SameDiff()
    private val stopper = EarlyStoppingTrainer()

    fun run() {
        net.fit(1)
        graph.fit(2)
        diff.fit(3)
        stopper.fit()
        SparkDl4jMultiLayer().fit(4)
        val local = MultiLayerNetwork()
        local.fit(5)
        MultiLayerNetwork().fit(6)
    }
}
