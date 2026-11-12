// lexcode-expect: 0
// The machine-learning libraries used to apply a model, not to build one: Weka classifies an instance,
// Tribuo predicts, Smile predicts, OpenNLP finds names with a trained model, and Neuroph runs a
// network forward. The look-alikes are an app's own trainer class and a static fit of its own, in a
// file that imports the libraries (the buildClassifier look-alike is in the second negative file).
package demo.scoring

import opennlp.tools.namefind.NameFinderME
import org.neuroph.core.NeuralNetwork
import org.tribuo.Model
import org.tribuo.Trainer
import smile.classification.RandomForest
import weka.classifiers.Classifier
import weka.core.Instance

class Scorer(
    private val classifier: Classifier,
    private val model: Model<*>,
    private val forest: RandomForest,
    private val finder: NameFinderME,
    private val network: NeuralNetwork<*>,
) {
    fun weka(instance: Instance) = classifier.classifyInstance(instance)

    fun tribuo(example: Any) = model.predict(example)

    fun smile(row: DoubleArray) = forest.predict(row)

    fun names(tokens: Array<String>) = finder.find(tokens)

    fun neuroph(input: DoubleArray) {
        network.setInput(*input)
        network.calculate()
    }
}

class Trainer2(val name: String) {
    fun train(plan: String) {}
}

object Curve {
    fun fit(points: List<Double>): Double = points.sum()
}

class Pupil {
    fun learn(lesson: Int) {}
}

class School(private val pupil: Pupil) {
    fun teach() {
        pupil.learn(1)
        val student = Pupil()
        student.learn(2)
    }
}

class Shop(private val coach: Trainer2) {
    fun run() {
        coach.train("legs")
        Curve.fit(listOf(1.0))
        val local = Trainer2("a")
        local.train("arms")
    }
}
