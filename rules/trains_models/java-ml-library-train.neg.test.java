// lexcode-expect: 0
// Classic JVM machine-learning libraries used to apply models that were trained elsewhere:
// Weka classifies with a serialized model, Tribuo and Smile predict, OpenNLP tags text with a
// downloaded model file. The look-alikes are a Trainer of the app's own, a factory method that
// shares Weka's method name, and a static fit on a class that is not from a Smile package.
package demo.apply;

import java.io.IOException;
import java.io.InputStream;
import opennlp.tools.namefind.NameFinderME;
import opennlp.tools.namefind.TokenNameFinderModel;
import opennlp.tools.util.Span;
import org.tribuo.Example;
import org.tribuo.Model;
import org.tribuo.Prediction;
import org.tribuo.classification.Label;
import smile.classification.RandomForest;
import weka.classifiers.Classifier;
import weka.core.Instance;
import weka.core.Instances;
import weka.core.SerializationHelper;

public class Applier {
  public double weka(String modelFile, Instance row) throws Exception {
    Classifier loaded = (Classifier) SerializationHelper.read(modelFile);
    return loaded.classifyInstance(row);
  }

  public Prediction<Label> tribuo(Model<Label> model, Example<Label> example) {
    return model.predict(example);
  }

  public int smile(RandomForest forest, double[] features) {
    return forest.predict(features);
  }

  public Span[] opennlp(InputStream modelIn, String[] tokens) throws IOException {
    TokenNameFinderModel model = new TokenNameFinderModel(modelIn);
    NameFinderME finder = new NameFinderME(model);
    return finder.find(tokens);
  }
}

class Trainer<T> {
  T train(T candidate) {
    return candidate;
  }
}

class Squad {
  String drill(Trainer<String> coach) {
    return coach.train("sprints");
  }
}

class ClassifierFactory {
  Object buildClassifier(String name) {
    return name.toUpperCase();
  }

  Object make() {
    return buildClassifier("spam");
  }
}

class Curve {
  static Curve fit(double[] xs) {
    return new Curve();
  }

  Curve again(double[] xs) {
    return Curve.fit(xs);
  }
}
