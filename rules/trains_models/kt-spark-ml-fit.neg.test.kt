// lexcode-expect: 0
// Spark MLlib used for something other than fitting a model: a saved pipeline is loaded and applied, a
// feature transformer is fitted (StringIndexer and StandardScaler prepare data and learn no model of
// their own), and a Dataset is aggregated. The look-alikes are an app's own Tailor and Playbook.
package demo.scoring

import org.apache.spark.ml.PipelineModel
import org.apache.spark.ml.classification.LogisticRegressionModel
import org.apache.spark.ml.feature.StandardScaler
import org.apache.spark.ml.feature.StringIndexer
import org.apache.spark.mllib.classification.NaiveBayesModel
import org.apache.spark.sql.Dataset
import org.apache.spark.sql.Row

class Scorer(private val indexer: StringIndexer, private val scaler: StandardScaler) {
    fun prepare(df: Dataset<Row>): Dataset<Row> {
        val indexed = indexer.fit(df).transform(df)
        return scaler.fit(indexed).transform(indexed)
    }

    fun inline(df: Dataset<Row>) {
        StringIndexer().setInputCol("label").setOutputCol("indexed").fit(df)
        val local = StandardScaler()
        local.fit(df)
    }

    fun score(df: Dataset<Row>): Dataset<Row> {
        val model = PipelineModel.load("/models/churn")
        return model.transform(df)
    }

    fun coefficients(model: LogisticRegressionModel) = model.coefficients()

    fun totals(df: Dataset<Row>) = df.groupBy("country").count()
}

class Tailor {
    fun fit(suit: String) {}
}

class Playbook {
    companion object {
        fun train(plan: String) {}
    }
}

class Shop(private val tailor: Tailor) {
    fun run() {
        tailor.fit("jacket")
        Playbook.train("spring")
    }
}
