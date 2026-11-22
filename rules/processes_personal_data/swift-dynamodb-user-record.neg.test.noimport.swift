// lexcode-expect: 0
import Foundation

// An app's own DynamoDB namespace with an input of the same name, in a file that does not import
// SotoDynamoDB.
enum DynamoDB {
    struct PutItemCodableInput<T> {
        let item: T
        let tableName: String
    }
}

func stage(user: String) {
    _ = DynamoDB.PutItemCodableInput(item: user, tableName: "users")
}
