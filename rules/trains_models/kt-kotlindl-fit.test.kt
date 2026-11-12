// lexcode-expect: 4
// Programs that train a KotlinDL network: through a use block with the dataset and epochs named,
// by a typed parameter, a model built in the function, and a direct call on a new model.
package org.example.fieldnotes.train.dl

import org.jetbrains.kotlinx.dl.api.core.Functional
import org.jetbrains.kotlinx.dl.api.core.Sequential
import org.jetbrains.kotlinx.dl.api.core.loss.Losses
import org.jetbrains.kotlinx.dl.api.core.optimizer.Adam

class KotlinDlTraining(private val model: Sequential, private val train: Any) {
    fun withUse() {
        model.use {
            it.compile(optimizer = Adam(), loss = Losses.SOFT_MAX_CROSS_ENTROPY_WITH_LOGITS)
            it.fit(dataset = train, epochs = 10, batchSize = 100)
        }
    }

    fun typed(graph: Functional) {
        graph.fit(train, train, 5, 64, 64)
    }

    fun built(layers: Any) {
        val fresh = Sequential.of(layers)
        fresh.fit(train, train, 3, 32, 32)
        Sequential.of(layers).fit(train, train, 2, 32, 32)
    }
}
