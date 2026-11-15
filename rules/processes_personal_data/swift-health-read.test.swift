// lexcode-expect: 9
import HealthKit
import Foundation

final class HeartRateReader {
    let store = HKHealthStore()
    let heartRate = HKQuantityType(.heartRate)

    func recent() {
        let query = HKSampleQuery(sampleType: heartRate, predicate: nil, limit: 20, sortDescriptors: nil) { _, samples, _ in
            print(samples ?? [])
        }
        store.execute(query)
    }

    func average() {
        let query = HKStatisticsQuery(
            quantityType: heartRate,
            quantitySamplePredicate: nil,
            options: .discreteAverage
        ) { _, stats, _ in
            print(stats as Any)
        }
        store.execute(query)
    }

    func modern() async throws {
        let descriptor = HKSampleQueryDescriptor(
            predicates: [.quantitySample(type: heartRate)],
            sortDescriptors: [SortDescriptor(\.endDate, order: .reverse)],
            limit: 10
        )
        let results = try await descriptor.result(for: store)
        print(results)
    }

    func latest() async throws -> [HKQuantitySample] {
        try await HKSampleQueryDescriptor(
            predicates: [.quantitySample(type: heartRate)],
            sortDescriptors: [],
            limit: 1
        ).result(for: store)
    }

    func latestOrNone() async -> [HKQuantitySample]? {
        try? await HKSampleQueryDescriptor(predicates: [.quantitySample(type: heartRate)], sortDescriptors: [], limit: 1).result(for: store)
    }

    func profile() throws {
        let dob = try store.dateOfBirthComponents()
        let sex = try store.biologicalSex()
        let blood = try store.bloodType()
        print(dob, sex, blood)
    }

    func anchored() {
        let query = HKAnchoredObjectQuery(type: heartRate, predicate: nil, anchor: nil, limit: HKObjectQueryNoLimit) { _, added, _, _, _ in
            print(added ?? [])
        }
        store.execute(query)
    }
}
