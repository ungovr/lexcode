// lexcode-expect: 2
// The same calls with wildcard imports of the Spark MLlib packages: a wildcard binds no class name, so
// these are matched by the estimator names the rule lists.
package org.example.fieldnotes.train.spark.wild

import org.apache.spark.ml.classification.*
import org.apache.spark.mllib.clustering.*

class WildSparkTraining(private val regression: LogisticRegression) {
    fun typed(df: Any) {
        regression.fit(df)
    }

    fun older(rdd: Any) {
        KMeans.train(rdd, 4, 20)
    }
}
