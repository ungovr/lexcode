// lexcode-expect: 0
// A project's own Trainer and EasyTrain classes in a file with no Deep Java Library import: the
// class names and the method names alone are not model training.
package demo.coach

class Trainer {
    fun trainBatch(plan: String) {}
    fun step() {}
}

object EasyTrain {
    fun fit(trainer: Trainer, weeks: Int) {}
    fun trainBatch(trainer: Trainer, plan: String) {}
}

class Gym(private val coach: Trainer) {
    fun session() {
        EasyTrain.fit(coach, 12)
        EasyTrain.trainBatch(coach, "legs")
        coach.trainBatch("arms")
        coach.step()
    }
}
