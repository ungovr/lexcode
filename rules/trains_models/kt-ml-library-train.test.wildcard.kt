// lexcode-expect: 3
// The libraries reached through wildcard imports: Smile's static fit, OpenNLP's train on a ...ME class,
// and a Neuroph network built in the function. A wildcard binds no class name, so these arms match by
// the names the rule lists.
package org.example.fieldnotes.train.libs.wild

import opennlp.tools.namefind.*
import org.neuroph.nnet.*
import smile.classification.*

class WildLibraries {
    fun smile(formula: Any, rows: Any) {
        RandomForest.fit(formula, rows)
    }

    fun opennlp(samples: Any, params: Any) {
        NameFinderME.train("en", null, samples, params, null)
    }

    fun neuroph(set: Any) {
        val network = MultiLayerPerceptron(2, 3, 1)
        network.learn(set)
    }
}
