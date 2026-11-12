// lexcode-expect: 5
// Spark MLlib training: fit on an estimator held in a variable, on a chained builder, on a
// pipeline, on a cross-validator, and the RDD-based static train calls.
package demo.churn;

import org.apache.spark.api.java.JavaRDD;
import org.apache.spark.ml.Pipeline;
import org.apache.spark.ml.PipelineModel;
import org.apache.spark.ml.classification.LogisticRegression;
import org.apache.spark.ml.classification.LogisticRegressionModel;
import org.apache.spark.ml.tuning.CrossValidator;
import org.apache.spark.ml.tuning.CrossValidatorModel;
import org.apache.spark.mllib.clustering.KMeans;
import org.apache.spark.mllib.clustering.KMeansModel;
import org.apache.spark.mllib.linalg.Vector;
import org.apache.spark.sql.Dataset;
import org.apache.spark.sql.Row;

public class ChurnTraining {
  public LogisticRegressionModel direct(Dataset<Row> training) {
    LogisticRegression lr = new LogisticRegression();
    lr.setMaxIter(10);
    lr.setRegParam(0.3);
    return lr.fit(training);
  }

  public LogisticRegressionModel chained(Dataset<Row> training) {
    return new LogisticRegression().setMaxIter(20).setElasticNetParam(0.8).fit(training);
  }

  public PipelineModel pipeline(Pipeline pipeline, Dataset<Row> training) {
    return pipeline.fit(training);
  }

  public CrossValidatorModel tune(CrossValidator cv, Dataset<Row> training) {
    return cv.fit(training);
  }

  public KMeansModel segments(JavaRDD<Vector> customers) {
    return KMeans.train(customers.rdd(), 5, 20);
  }
}
