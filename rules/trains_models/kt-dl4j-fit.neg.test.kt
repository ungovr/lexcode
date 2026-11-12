// lexcode-expect: 0
// Deeplearning4j used for inference only: a saved network is loaded and asked for outputs, and its
// parameters are counted. The look-alikes call fit on other things, in a file that does import the
// network classes.
package demo.scoring

import java.io.File
import org.deeplearning4j.nn.graph.ComputationGraph
import org.deeplearning4j.nn.multilayer.MultiLayerNetwork
import org.deeplearning4j.util.ModelSerializer
import org.nd4j.linalg.api.ndarray.INDArray
import org.deeplearning4j.earlystopping.trainer.EarlyStoppingTrainer
import org.deeplearning4j.spark.impl.multilayer.SparkDl4jMultiLayer
import org.nd4j.autodiff.samediff.SameDiff
import org.nd4j.linalg.factory.Nd4j

class Scorer(modelFile: File, graphFile: File) {
    private val network: MultiLayerNetwork = ModelSerializer.restoreMultiLayerNetwork(modelFile)
    private val graph: ComputationGraph = ModelSerializer.restoreComputationGraph(graphFile)

    fun score(features: DoubleArray): DoubleArray {
        val input: INDArray = Nd4j.create(features)
        val out = network.output(input)
        val second = graph.outputSingle(input)
        return out.add(second).toDoubleVector()
    }

    fun parameterCount(): Long = network.numParams() + graph.numParams()
}

class Panel {
    private val layout = Layout()

    fun resize(width: Int, height: Int) {
        layout.fit(width, height)
    }
}

class Layout {
    fun fit(width: Int, height: Int) {}
}

class RunLog {
    fun line(text: String) {
        val w = Window()
        w.fit(text)
    }
}

class Window {
    fun fit(text: String) {}
}
