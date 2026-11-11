// lexcode-expect: 0
// A request address that reaches calls that are not a stored address: a screen or registry object
// with logger-like method names, a logger-named receiver with a method that is not a log level, a
// select and a delete statement, and a property that is not an address saved with the object.
package demo.web

import jakarta.servlet.http.HttpServletRequest
import java.sql.Connection
import org.springframework.jdbc.core.JdbcTemplate

class Screen {
    fun info(message: Any?) = println(message)
    fun error(message: Any?) = println(message)
    fun info(block: () -> Any?) = println(block())
    fun error(block: () -> Any?) = println(block())
}

class Registry {
    fun lookup(address: String?): String = "none"
    fun scope(block: () -> Any?): String = block().toString()
}

class Note(var note: String = "", val remark: String = "")

interface Notes {
    fun save(note: Note): Note
}

class ScreenHandler(
    private val connection: Connection,
    private val jdbc: JdbcTemplate,
    private val notes: Notes,
) {
    private val display = Screen()
    private val log = Registry()

    // Not a logger: a console screen with the log-level names.
    fun show(request: HttpServletRequest) {
        display.info(request.remoteAddr)
        display.error(request.remoteAddr)
        display.info { request.remoteAddr }
        display.error { "from ${request.remoteAddr}" }
    }

    // A logger-named receiver, but not a log level.
    fun named(request: HttpServletRequest) {
        log.lookup(request.remoteAddr)
        log.scope { request.remoteAddr }
    }

    // A select through the use block and through a local, and a delete through the template.
    fun query(request: HttpServletRequest) {
        val ip = request.remoteAddr
        connection.prepareStatement("select count(*) from hits where ip = ?").use { ps ->
            ps.setString(1, ip)
            ps.executeQuery()
        }
        val lookup = connection.prepareStatement("select count(*) from bans where ip = ?")
        lookup.setString(1, ip)
        jdbc.update("delete from sessions where ip = ?", ip)
    }

    // The object is saved, but the property that takes the address is not an address property.
    fun remember(request: HttpServletRequest) {
        val note = Note()
        note.note = request.remoteAddr
        notes.save(note)
        notes.save(Note(remark = request.remoteAddr))
    }
}
