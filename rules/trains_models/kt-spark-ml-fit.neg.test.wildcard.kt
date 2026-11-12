// lexcode-expect: 0
// Wildcard imports of Spark MLlib packages with calls that are not model training: a feature
// transformer fitted from the ml.feature wildcard (data preparation), a class of the project's own
// with fit and train, and a static train on a name that is not an MLlib estimator.
package demo.scoring.wild

import org.apache.spark.ml.classification.*
import org.apache.spark.ml.feature.*
import org.apache.spark.mllib.clustering.*

class Tailor {
    fun fit(suit: String) {}
}

object Playbook {
    fun train(plan: String) {}
}

class Prep(private val scaler: StandardScaler, private val indexer: StringIndexer) {
    fun run(df: Any) {
        scaler.fit(df)
        indexer.fit(df)
        val tailor = Tailor()
        tailor.fit("jacket")
        Playbook.train("spring")
        KMeans.load("/models/kmeans")
    }
}
