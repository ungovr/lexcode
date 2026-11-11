// lexcode-expect: 0
package example.reports

// A project DSL that happens to be called skrape: the file does not import the skrape library, so
// the request block below is the project's own and says nothing about fetching pages.
class Request {
    var url: String = ""
    var timeout: Int = 0
}

class Report(val rows: List<String>)

fun skrape(source: String, block: Report.() -> Unit): Report = Report(listOf(source)).apply(block)

fun request(block: Request.() -> Unit): Request = Request().apply(block)

class OwnReports {
    fun summary(): Report = skrape("daily") {
        request {
            url = "https://example.com/products"
        }
    }

    fun perPage(pageUrl: String): Report = skrape("weekly") {
        request {
            url = pageUrl
            timeout = 5000
        }
    }

    // An assignment named url outside any block.
    class Settings {
        var url: String = ""
        fun point() {
            url = "https://example.com/docs"
        }
    }
}
