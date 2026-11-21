// lexcode-expect: 0
import SotoDynamoDB

// Items that name no person or account (a cache entry, an order, a counter), and a read of a user.
struct CacheRepository {
    let db: DynamoDB

    func save(_ item: CacheEntry) async throws {
        _ = try await db.putItem(DynamoDB.PutItemCodableInput(item: item, tableName: "cache"))
    }

    func record(_ order: Order) async throws {
        _ = try await db.updateItem(DynamoDB.UpdateItemCodableInput(key: ["id"], tableName: "orders", updateItem: order))
    }

    func bump(_ userCount: Counter) async throws {
        _ = try await db.putItem(DynamoDB.PutItemCodableInput(item: userCount, tableName: "counters"))
    }

    func load(id: String) async throws -> DynamoDB.GetItemCodableOutput<User> {
        try await db.getItem(DynamoDB.GetItemInput(key: ["id": .s(id)], tableName: "users"), type: User.self)
    }
}
