// lexcode-expect: 4
// Deep Java Library training: EasyTrain over a dataset, and a hand-written loop that feeds a
// trainer one batch at a time and steps the optimizer.
package demo.vision;

import ai.djl.Model;
import ai.djl.training.DefaultTrainingConfig;
import ai.djl.training.EasyTrain;
import ai.djl.training.Trainer;
import ai.djl.training.dataset.Batch;
import ai.djl.training.dataset.Dataset;
import ai.djl.training.loss.Loss;
import java.io.IOException;

public class Fitter {
  public void fit(Model model, Dataset train, Dataset validate) throws IOException {
    DefaultTrainingConfig config = new DefaultTrainingConfig(Loss.softmaxCrossEntropyLoss());
    try (Trainer trainer = model.newTrainer(config)) {
      EasyTrain.fit(trainer, 10, train, validate);
    }
  }

  public void loop(Trainer trainer, Iterable<Batch> batches) {
    for (Batch batch : batches) {
      EasyTrain.trainBatch(trainer, batch);
      trainer.step();
      batch.close();
    }
  }

  public void manual(Trainer trainer, Batch batch) {
    trainer.trainBatch(batch);
  }
}
