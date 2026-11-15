// lexcode-expect: 0
import Foundation

// The app's own sensor log with HealthKit's names, in a file without HealthKit: readings from
// a lab instrument, not a person's health record.
struct HKSampleQuery {
    let sensor: String
}

final class Instrument {
    func dateOfBirthComponents() -> DateComponents { DateComponents() }
    func bloodType() -> String { "n/a" }
}

final class LabLog {
    let instrument = Instrument()

    func read() {
        let query = HKSampleQuery(sensor: "thermocouple-1")
        print(query, instrument.dateOfBirthComponents(), instrument.bloodType())
    }
}
