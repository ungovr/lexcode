// lexcode-expect: 6
// Jobs that fit Spark MLlib models: a typed estimator, a pipeline built with setters, a cross-validator
// held in a local, an estimator built in the function, a property built with the class, and a static
// train call of the older MLlib API.
package org.example.fieldnotes.train.spark

import org.apache.spark.ml.Pipeline
import org.apache.spark.ml.classification.LogisticRegression
import org.apache.spark.ml.feature.StringIndexer
import org.apache.spark.ml.regression.LinearRegression
import org.apache.spark.ml.tuning.CrossValidator
import org.apache.spark.mllib.clustering.KMeans
import org.apache.spark.sql.Dataset
import org.apache.spark.sql.Row

class SparkTraining(private val regression: LogisticRegression) {
    val linear = LinearRegression()

    fun typed(df: Dataset<Row>) {
        regression.fit(df)
    }

    fun pipeline(df: Dataset<Row>) {
        val stages = arrayOf(StringIndexer().setInputCol("a"), regression)
        Pipeline().setStages(stages).fit(df)
    }

    fun tuned(df: Dataset<Row>) {
        val cv = CrossValidator().setEstimator(regression).setNumFolds(3)
        cv.fit(df)
    }

    fun built(df: Dataset<Row>) {
        val fresh = LogisticRegression()
        fresh.fit(df)
    }

    fun property(df: Dataset<Row>) {
        linear.fit(df)
    }

    fun older(rdd: Any) {
        KMeans.train(rdd, 4, 20)
    }
}
