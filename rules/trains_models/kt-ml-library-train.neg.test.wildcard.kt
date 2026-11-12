// lexcode-expect: 0
// The same wildcard imports (and Tribuo's) with look-alike calls: a train on a class that is not a
// Tribuo trainer, a static fit and train on classes that are not Smile's or OpenNLP's, and a learn on a
// class that is not a Neuroph network.
package demo.scoring.wild

import opennlp.tools.namefind.*
import org.tribuo.*
import org.neuroph.nnet.*
import smile.classification.*

object Curve {
    fun fit(points: List<Double>): Double = points.sum()
}

object Rehearsal {
    fun train(plan: String) {}
}

class Gym {
    fun train(plan: String) {}
}

class Pupil {
    fun learn(lesson: Int) {}
}

class School {
    fun run() {
        Curve.fit(listOf(1.0))
        Rehearsal.train("act one")
        val student = Pupil()
        student.learn(2)
        val gym = Gym()
        gym.train("legs")
    }
}
