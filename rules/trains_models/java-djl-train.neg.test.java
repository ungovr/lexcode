// lexcode-expect: 0
// Deep Java Library used to run a model that was trained elsewhere: load it from the model zoo,
// build a predictor and ask it for answers. Creating a trainer object and closing it without
// feeding it a batch trains nothing. The look-alikes are a gym's Trainer and a Gradle task.
package demo.classify;

import ai.djl.Model;
import ai.djl.inference.Predictor;
import ai.djl.modality.Classifications;
import ai.djl.modality.cv.Image;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.translate.TranslateException;
import java.io.IOException;

public class Classifier implements AutoCloseable {
  private final ZooModel<Image, Classifications> model;

  public Classifier() throws Exception {
    Criteria<Image, Classifications> criteria =
        Criteria.builder()
            .setTypes(Image.class, Classifications.class)
            .optModelUrls("djl://ai.djl.pytorch/resnet18")
            .build();
    this.model = criteria.loadModel();
  }

  public Classifications classify(Image image) throws TranslateException {
    try (Predictor<Image, Classifications> predictor = model.newPredictor()) {
      return predictor.predict(image);
    }
  }

  @Override
  public void close() {
    model.close();
  }
}

class Trainer {
  private int reps;

  void trainBatch(String athlete) {
    reps += athlete.length();
  }

  int step() {
    return reps;
  }
}

class Gym {
  void session(Trainer coach) {
    coach.trainBatch("Ada");
    coach.step();
  }
}
