// lexcode-expect: 0
// Calls shaped like the machine-learning libraries' training calls, in a file that imports none of
// them. A static fit on a class named RandomForest, a train on a ...ME class, a trainer class of
// the project's own, and a learn on a network of its own are not the libraries.
package demo.sim

class RandomForest {
    companion object {
        fun fit(rows: Int): Int = rows
    }
}

object NameFinderME {
    fun train(text: String) {}
}

class ReportTrainer {
    fun train(rows: Int) {}
}

class Neuron {
    fun learn(x: Int) {}
}

class Perceptron {
    fun learn(x: Int) {}
}

interface Trainer<T> {
    fun train(x: Int)
}

class Hub(private val generic: Trainer<String>) {
    fun run() {
        generic.train(7)
    }
}

class Sim(private val reports: ReportTrainer, private val unit: Perceptron) {
    private val spare = Perceptron()

    fun run(host: demo.sim.Host) {
        RandomForest.fit(3)
        NameFinderME.train("a")
        reports.train(1)
        host.buildClassifier("tree")
        host.buildClusterer(2)
        unit.learn(2)
        spare.learn(3)
        val trainer = ReportTrainer()
        trainer.train(4)
    }
}
