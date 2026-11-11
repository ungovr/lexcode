// lexcode-expect: 8
// Programs that train a Deeplearning4j network, graph, SameDiff model or early-stopping trainer
// on data they hold: by a typed field, a typed parameter, a local built in the function, a property
// built with the class, and a direct call on a new object.
package org.example.fieldnotes.train

import org.deeplearning4j.earlystopping.trainer.EarlyStoppingTrainer
import org.deeplearning4j.nn.graph.ComputationGraph
import org.deeplearning4j.nn.multilayer.MultiLayerNetwork
import org.deeplearning4j.spark.impl.multilayer.SparkDl4jMultiLayer
import org.nd4j.autodiff.samediff.SameDiff
import org.nd4j.linalg.dataset.api.iterator.DataSetIterator

class Trainer(private val network: MultiLayerNetwork, private val iterator: DataSetIterator) {
    lateinit var graph: ComputationGraph
    val diff = SameDiff.create()
    val stopper = EarlyStoppingTrainer(null, null, null, null)

    fun epoch() {
        network.fit(iterator)
    }

    fun graphEpoch() {
        graph.fit(iterator)
    }

    fun local(conf: Any) {
        val fresh = MultiLayerNetwork(conf)
        fresh.fit(iterator)
    }

    fun stopEarly(early: EarlyStoppingTrainer) {
        early.fit()
    }
}

class Built(conf: Any, private val iterator: DataSetIterator) {
    val net = MultiLayerNetwork(conf)

    fun run() {
        net.fit(iterator)
        ComputationGraph(conf).fit(iterator)
    }

    fun spark(distributed: SparkDl4jMultiLayer, rdd: Any) {
        distributed.fit(rdd)
    }

    fun samediff(model: SameDiff, data: Any) {
        model.fit(data, 5)
    }
}
