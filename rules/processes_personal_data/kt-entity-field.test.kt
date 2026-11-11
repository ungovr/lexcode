// lexcode-expect: 8
// Persistent classes whose columns hold an email address, a phone number, a date of birth,
// a government identifier or an IP address: Room and JPA entities written as Kotlin classes, with
// the column in the primary constructor or in the body, and Spring Data MongoDB documents.
package demo.accounts

import androidx.room.ColumnInfo
import androidx.room.Entity
import androidx.room.PrimaryKey
import jakarta.persistence.Column
import jakarta.persistence.Embeddable
import jakarta.persistence.Id
import jakarta.persistence.MappedSuperclass
import java.time.LocalDate
import org.springframework.data.mongodb.core.mapping.Document

@Entity(tableName = "users")
data class UserEntity(
    @PrimaryKey val id: Long,
    val email: String,
    @ColumnInfo(name = "mobile") val mobile: String,
)

@Entity
class Customer(@Id var id: Long, @Column(name = "phone_number") var phoneNumber: String) {
    @Column
    var dateOfBirth: LocalDate? = null
}

@Document(collection = "profiles")
data class Profile(val id: String, val ssn: String)

@Embeddable
class Contact(var emailAddress: String)

@MappedSuperclass
abstract class Audited {
    @Column
    var ipAddress: String = ""
}

@Entity
class Traveller {
    @Id
    var id: Long = 0

    var passport: String? = null
}
