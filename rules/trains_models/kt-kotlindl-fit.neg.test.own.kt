// lexcode-expect: 0
// Calls shaped like KotlinDL's fit, in a file with no KotlinDL import: a project's own Sequential
// class, and a fit with an epochs argument on a qualified receiver. Without the import nothing here
// is KotlinDL.
package demo.curve

class Sequential {
    fun fit(dataset: Any, epochs: Int) {}
}

class Fitter(private val sequence: demo.curve.Sequential, private val spline: demo.math.Spline) {
    private val own: Sequential = Sequential()

    fun run(data: Any) {
        own.fit(dataset = data, epochs = 10)
        spline.fit(dataset = data, epochs = 5)
        spline.fit(dataset = data)
        val local = Sequential()
        local.fit(data, 3)
        Sequential().fit(data, 2)
    }
}
