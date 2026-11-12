// lexcode-expect: 0
// A file that imports one Tribuo trainer (LogisticRegressionTrainer) and has a ReportTrainer of its
// own: the trainer it calls is not the class the file imports, so its train is not Tribuo's. The
// receiver is a parameter, a property built with the class and a local.
package demo.reports

import org.tribuo.classification.sgd.linear.LogisticRegressionTrainer

class ReportTrainer {
    fun train(rows: Int) {}
}

class Reports(private val reports: ReportTrainer, private val tribuo: LogisticRegressionTrainer) {
    private val spare = ReportTrainer()

    fun run() {
        reports.train(1)
        spare.train(2)
        val local = ReportTrainer()
        local.train(3)
    }
}
