// lexcode-expect: 4
import Models
import SotoDynamoDB

struct DynamoUserRepository {
    let db: DynamoDB
    let tableName = "app-user-table"

    func createUser(_ user: DynamoDBUser) async throws {
        let input = DynamoDB.PutItemCodableInput(item: user, tableName: self.tableName)
        _ = try await db.putItem(input)
    }

    func updateUser(_ newUser: DynamoDBUser) async throws {
        let input = DynamoDB.UpdateItemCodableInput(
            key: ["id"],
            tableName: self.tableName,
            updateItem: newUser
        )
        _ = try await db.updateItem(input)
    }

    func saveMember(_ member: Member) async throws {
        _ = try await db.putItem(DynamoDB.PutItemCodableInput(conditionExpression: "attribute_not_exists(id)", item: member, tableName: "members"))
    }

    func saveProfile(_ customer_profile: Profile) async throws {
        _ = try await db.putItem(DynamoDB.PutItemCodableInput(item: customer_profile, tableName: "profiles"))
    }
}
