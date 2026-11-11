// lexcode-expect: 8
// Programs that build models with the JVM machine-learning libraries: Weka builds a classifier and a
// clusterer, Tribuo trains with a Trainer held typed and one built in the function, Smile fits a random
// forest and a regression, OpenNLP trains a name finder, and Neuroph trains a network.
package org.example.fieldnotes.train.libs

import opennlp.tools.namefind.NameFinderME
import org.neuroph.nnet.MultiLayerPerceptron
import org.tribuo.Trainer
import org.tribuo.classification.sgd.linear.LogisticRegressionTrainer
import smile.classification.RandomForest
import smile.regression.OLS
import weka.classifiers.trees.J48
import weka.clusterers.SimpleKMeans

class Libraries(private val tree: J48, private val means: SimpleKMeans, private val trainer: Trainer<Any>) {
    fun weka(data: Any) {
        tree.buildClassifier(data)
        means.buildClusterer(data)
    }

    fun tribuoTyped(examples: Any) {
        trainer.train(examples)
    }

    fun tribuoBuilt(examples: Any) {
        val logistic = LogisticRegressionTrainer()
        logistic.train(examples)
    }

    fun smile(formula: Any, rows: Any) {
        RandomForest.fit(formula, rows)
        OLS.fit(formula, rows)
    }

    fun opennlp(samples: Any, params: Any) {
        NameFinderME.train("en", null, samples, params, null)
    }

    fun neuroph(set: Any) {
        val network = MultiLayerPerceptron(2, 3, 1)
        network.learn(set)
    }
}
