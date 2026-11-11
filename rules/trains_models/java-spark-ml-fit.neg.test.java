// lexcode-expect: 0
// Spark MLlib used to apply a model that already exists: load a saved pipeline model and
// transform data with it, or run a Spark SQL aggregation. The look-alikes call fit or train
// on classes that are not Spark estimators.
package demo.scoring;

import org.apache.spark.ml.PipelineModel;
import org.apache.spark.ml.classification.LogisticRegressionModel;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;
import org.apache.spark.sql.SparkSession;

public class BatchScorer {
  private final SparkSession spark;

  public BatchScorer(SparkSession spark) {
    this.spark = spark;
  }

  public Dataset<Row> score(String modelPath, String inputPath) {
    PipelineModel model = PipelineModel.load(modelPath);
    Dataset<Row> input = spark.read().parquet(inputPath);
    return model.transform(input).select("id", "prediction");
  }

  public double[] coefficients(String path) {
    LogisticRegressionModel model = LogisticRegressionModel.load(path);
    return model.coefficients().toArray();
  }

  public long countByDay(Dataset<Row> events) {
    return events.groupBy("day").count().count();
  }
}

class Tailor {
  Suit fit(Customer customer) {
    return new Suit(customer);
  }
}

class Shop {
  Suit order(Customer customer) {
    Tailor tailor = new Tailor();
    return tailor.fit(customer);
  }
}

class Coach {
  void drill(String player) {
    Playbook.train(player);
  }
}
