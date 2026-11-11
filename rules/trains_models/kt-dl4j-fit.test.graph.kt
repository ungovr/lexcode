// lexcode-expect: 2
// The graph variants of the Deeplearning4j trainers: an early-stopping trainer for a ComputationGraph
// and the Spark ComputationGraph wrapper.
package org.example.fieldnotes.train.graph

import org.deeplearning4j.earlystopping.trainer.EarlyStoppingGraphTrainer
import org.deeplearning4j.spark.impl.graph.SparkComputationGraph

class GraphTrainers(private val early: EarlyStoppingGraphTrainer, private val distributed: SparkComputationGraph) {
    fun run(rdd: Any) {
        early.fit()
        distributed.fit(rdd)
    }
}
