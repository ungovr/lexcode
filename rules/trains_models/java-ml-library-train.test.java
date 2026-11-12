// lexcode-expect: 7
// Classic JVM machine-learning libraries fitting a model: Weka's buildClassifier and
// buildClusterer, a Tribuo Trainer, Smile's static fit, OpenNLP's train, Neuroph's learn and a
// TensorFlow optimizer step.
package demo.learn;

import java.io.IOException;
import opennlp.tools.doccat.DoccatFactory;
import opennlp.tools.doccat.DoccatModel;
import opennlp.tools.doccat.DocumentCategorizerME;
import opennlp.tools.doccat.DocumentSample;
import opennlp.tools.util.ObjectStream;
import opennlp.tools.util.TrainingParameters;
import org.neuroph.core.NeuralNetwork;
import org.neuroph.core.data.DataSet;
import org.neuroph.nnet.learning.BackPropagation;
import org.tensorflow.Operand;
import org.tensorflow.framework.optimizers.Adam;
import org.tensorflow.op.Op;
import org.tribuo.Dataset;
import org.tribuo.Model;
import org.tribuo.Trainer;
import org.tribuo.classification.Label;
import smile.classification.RandomForest;
import smile.data.DataFrame;
import smile.data.formula.Formula;
import weka.classifiers.Classifier;
import weka.classifiers.trees.J48;
import weka.clusterers.SimpleKMeans;
import weka.core.Instances;

public class Learner {
  public Classifier wekaTree(Instances data) throws Exception {
    J48 tree = new J48();
    tree.buildClassifier(data);
    return tree;
  }

  public SimpleKMeans wekaClusters(Instances data) throws Exception {
    SimpleKMeans kmeans = new SimpleKMeans();
    kmeans.setNumClusters(4);
    kmeans.buildClusterer(data);
    return kmeans;
  }

  public Model<Label> tribuo(Trainer<Label> trainer, Dataset<Label> data) {
    return trainer.train(data);
  }

  public RandomForest smile(DataFrame frame) {
    return RandomForest.fit(Formula.lhs("label"), frame);
  }

  public DoccatModel opennlp(ObjectStream<DocumentSample> samples) throws IOException {
    return DocumentCategorizerME.train("en", samples, TrainingParameters.defaultParams(), new DoccatFactory());
  }

  public void neuroph(NeuralNetwork<BackPropagation> network, DataSet examples) {
    network.learn(examples);
  }

  public Op tensorflow(Adam optimizer, Operand<?> loss) {
    return optimizer.minimize(loss);
  }
}
