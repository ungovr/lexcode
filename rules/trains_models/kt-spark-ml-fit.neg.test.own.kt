// lexcode-expect: 0
// A project's own classes named like Spark MLlib's estimators, in a file with no Spark import: their
// fit and train methods are not model training.
package demo.curves

class LogisticRegression {
    fun fit(x: Int) {}
}

class Pipeline {
    fun setStages(n: Int): Pipeline = this
    fun fit(x: Int) {}
}

object KMeans {
    fun train(x: Int) {}
}

class Fitter(private val lr: LogisticRegression) {
    fun run() {
        lr.fit(1)
        LogisticRegression().fit(2)
        Pipeline().setStages(3).fit(4)
        val p = Pipeline()
        p.fit(5)
        KMeans.train(6)
    }
}
