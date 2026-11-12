// lexcode-expect: 0
// Deeplearning4j used for inference only: a saved network is loaded and asked for outputs,
// and its parameters are counted. The look-alikes call fit on other things.
package demo.scoring;

import java.io.File;
import java.io.IOException;
import org.deeplearning4j.nn.graph.ComputationGraph;
import org.deeplearning4j.nn.multilayer.MultiLayerNetwork;
import org.deeplearning4j.util.ModelSerializer;
import org.nd4j.linalg.api.ndarray.INDArray;
import org.nd4j.linalg.factory.Nd4j;

public class Scorer {
  private final MultiLayerNetwork network;
  private final ComputationGraph graph;

  public Scorer(File modelFile, File graphFile) throws IOException {
    this.network = ModelSerializer.restoreMultiLayerNetwork(modelFile);
    this.graph = ModelSerializer.restoreComputationGraph(graphFile);
  }

  public double[] score(double[] features) {
    INDArray input = Nd4j.create(features);
    INDArray out = network.output(input);
    INDArray second = graph.outputSingle(input);
    return out.add(second).toDoubleVector();
  }

  public long parameterCount() {
    return network.numParams() + graph.numParams();
  }
}

class Panel {
  private final Layout layout = new Layout();

  void resize(int width, int height) {
    layout.fit(width, height);
  }
}

class Layout {
  void fit(int width, int height) {}
}

class RunLog {
  void line(String text) {
    Window w = new Window();
    w.fit(text);
  }
}

class Window {
  void fit(String text) {}
}
