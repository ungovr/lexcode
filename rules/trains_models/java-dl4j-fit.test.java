// lexcode-expect: 7
// Deeplearning4j training: fit on a network built here, on one restored to keep training,
// on a graph, on a SameDiff model, on an early-stopping trainer and on a Spark wrapper.
package demo.recommender;

import java.io.File;
import java.io.IOException;
import org.deeplearning4j.earlystopping.trainer.EarlyStoppingTrainer;
import org.deeplearning4j.nn.conf.MultiLayerConfiguration;
import org.deeplearning4j.nn.graph.ComputationGraph;
import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.deeplearning4j.spark.impl.multilayer.SparkDl4jMultiLayer;
import org.deeplearning4j.util.ModelSerializer;
import org.nd4j.autodiff.samediff.SameDiff;
import org.nd4j.linalg.dataset.api.iterator.DataSetIterator;

public class Retrainer {
  private final MultiLayerNetwork field;

  public Retrainer(MultiLayerNetwork field) {
    this.field = field;
  }

  public MultiLayerNetwork trainFresh(MultiLayerConfiguration conf, DataSetIterator clicks) {
    MultiLayerNetwork net = new MultiLayerNetwork(conf);
    net.init();
    for (int epoch = 0; epoch < 10; epoch++) {
      net.fit(clicks);
    }
    return net;
  }

  public void continueTraining(File saved, DataSetIterator newClicks) throws IOException {
    MultiLayerNetwork restored = ModelSerializer.restoreMultiLayerNetwork(saved);
    restored.fit(newClicks, 3);
    field.fit(newClicks);
  }

  public void trainGraph(ComputationGraph graph, DataSetIterator data) {
    graph.fit(data);
  }

  public void trainSameDiff(SameDiff sd, DataSetIterator data) {
    sd.fit(data, 5);
  }

  public void stopEarly(EarlyStoppingTrainer trainer) {
    trainer.fit();
  }

  public void cluster(SparkDl4jMultiLayer sparkNet, org.apache.spark.api.java.JavaRDD<org.nd4j.linalg.dataset.DataSet> rdd) {
    sparkNet.fit(rdd);
  }
}
