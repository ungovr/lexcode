// lexcode-expect: 0
// KotlinDL used for inference only: a saved model is loaded, weights are read, and the model is asked
// to predict and to evaluate on a test set. The look-alikes call fit on a layout, and name an epochs
// argument on something that is not fit, in a file that does import KotlinDL.
package demo.scoring

import java.io.File
import org.jetbrains.kotlinx.dl.api.core.Sequential
import org.jetbrains.kotlinx.dl.api.core.loss.Losses
import org.jetbrains.kotlinx.dl.api.core.metric.Metrics

class Scorer(private val model: Sequential, weights: File) {
    init {
        model.loadWeights(weights)
    }

    fun label(features: FloatArray): Int = model.predict(features)

    fun accuracy(test: Any): Double {
        model.use {
            it.compile(loss = Losses.SOFT_MAX_CROSS_ENTROPY_WITH_LOGITS, metric = Metrics.ACCURACY)
            return it.evaluate(dataset = test, batchSize = 100).metrics[Metrics.ACCURACY] ?: 0.0
        }
    }
}

class Panel {
    private val layout = Layout()

    fun resize(width: Int, height: Int) {
        layout.fit(width, height)
        layout.schedule(epochs = 3)
    }
}

class Layout {
    fun fit(width: Int, height: Int) {}
    fun schedule(epochs: Int) {}
}
