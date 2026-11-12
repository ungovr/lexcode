// lexcode-expect: 0
// Deep Java Library used for inference: a model is loaded from the zoo and asked to predict, a
// trainer is created and never fed a batch, and the evaluation helper only scores a dataset. The
// look-alikes are an app's own Trainer and EasyTrain with the same method names.
package demo.classify

import ai.djl.Model
import ai.djl.repository.zoo.Criteria
import ai.djl.training.Trainer
import ai.djl.training.TrainingConfig

class Classifier(private val model: Model, private val config: TrainingConfig) {
    fun label(criteria: Criteria<String, String>, text: String): String {
        criteria.loadModel().use { loaded ->
            loaded.newPredictor().use { predictor -> return predictor.predict(text) }
        }
    }

    fun open(): Trainer = model.newTrainer(config)

    fun size(trainer: Trainer): Int = trainer.model.block.parameters.size()
}

class Shop(private val trainer: demo.shop.Trainer) {
    fun restock() {
        trainer.trainBatch("shelf")
        trainer.step()
        demo.shop.EasyTrain.fit(trainer, 3)
    }
}
