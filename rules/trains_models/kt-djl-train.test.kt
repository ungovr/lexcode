// lexcode-expect: 5
// Training with Deep Java Library: EasyTrain over a dataset, EasyTrain on one batch, a trainer
// received as a parameter, and a trainer created in a use block.
package org.example.fieldnotes.train.djl

import ai.djl.Model
import ai.djl.training.EasyTrain
import ai.djl.training.Trainer
import ai.djl.training.TrainingConfig
import ai.djl.training.dataset.Batch
import ai.djl.training.dataset.Dataset

class DjlTraining(private val model: Model, private val config: TrainingConfig, private val trainer: Trainer) {
    fun fitAll(train: Dataset, validate: Dataset) {
        EasyTrain.fit(trainer, 10, train, validate)
    }

    fun one(batch: Batch) {
        EasyTrain.trainBatch(trainer, batch)
    }

    fun manual(batch: Batch, given: Trainer) {
        given.trainBatch(batch)
        given.step()
    }

    fun scoped(batch: Batch) {
        model.newTrainer(config).use { local ->
            local.trainBatch(batch)
        }
    }
}
