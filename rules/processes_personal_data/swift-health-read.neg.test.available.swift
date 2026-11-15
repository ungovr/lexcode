// lexcode-expect: 0
import HealthKit
import SwiftUI

// With HealthKit imported: the app only checks whether Health exists on this device and
// converts units for display. It reads nothing about the person.
struct HealthBadge: View {
    let available = HKHealthStore.isHealthDataAvailable()
    let unit = HKUnit.count().unitDivided(by: .minute())

    var body: some View {
        Text(available ? "Health ready (\(unit.unitString))" : "No Health")
    }
}
