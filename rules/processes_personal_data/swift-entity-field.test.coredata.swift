// lexcode-expect: 3
import Foundation
import CoreData

@objc(Member)
public class Member: NSManagedObject {}

extension Member {
    @NSManaged public var email: String?
    @NSManaged public var lastName: String?
    @NSManaged var mobileNumber: String
    @NSManaged public var joinedAt: Date?
    @NSManaged public var title: String?
}
