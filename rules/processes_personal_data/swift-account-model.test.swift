// lexcode-expect: 5
import Fluent
import Vapor

final class User: Model, Content, @unchecked Sendable {
    static let schema = "users"
    @ID(key: .id) var id: UUID?
    @Field(key: "username") var username: String
    @Field(key: "password_hash") var passwordHash: String
    init() {}
}

extension User: ModelAuthenticatable {
    static let usernameKey = \User.$username
    static let passwordHashKey = \User.$passwordHash

    func verify(password: String) throws -> Bool {
        try Bcrypt.verify(password, created: self.passwordHash)
    }
}

final class Member: Model, ModelAuthenticatable, @unchecked Sendable {
    static let schema = "members"
    static let usernameKey = \Member.$login
    static let passwordHashKey = \Member.$secret
    @ID(key: .id) var id: UUID?
    @Field(key: "login") var login: String
    @Field(key: "secret") var secret: String
    init() {}

    func verify(password: String) throws -> Bool {
        try Bcrypt.verify(password, created: self.secret)
    }
}

final class AdminAccount: Model, @unchecked Sendable {
    static let schema = "admins"
    @ID(key: .id) var id: UUID?
    @Field(key: "login") var login: String
    @Field(key: "secret") var secret: String
    init() {}
}

extension AdminAccount: ModelAuthenticatable {
    static var usernameKey: KeyPath<AdminAccount, Field<String>> { \AdminAccount.$login }
    static var passwordHashKey: KeyPath<AdminAccount, Field<String>> { \AdminAccount.$secret }
    func verify(password: String) throws -> Bool { false }
}

extension Member: ModelSessionAuthenticatable {}

final class Staff: ModelAuthenticatable, Model, @unchecked Sendable {
    static let schema = "staff"
    static let usernameKey = \Staff.$email
    static let passwordHashKey = \Staff.$hash
    @ID(key: .id) var id: UUID?
    @Field(key: "email") var email: String
    @Field(key: "hash") var hash: String
    init() {}
    func verify(password: String) throws -> Bool { false }
}

final class Operator: Model, Content, ModelAuthenticatable, @unchecked Sendable {
    static let schema = "operators"
    static let usernameKey = \Operator.$login
    static let passwordHashKey = \Operator.$hash
    @ID(key: .id) var id: UUID?
    @Field(key: "login") var login: String
    @Field(key: "hash") var hash: String
    init() {}
    func verify(password: String) throws -> Bool { false }
}

func routes(_ app: Application) {
    let protected = app.grouped(User.authenticator())
    protected.post("login") { req in
        try req.auth.require(User.self)
    }
    let sessions = app.grouped(Member.sessionAuthenticator())
    print(sessions)
}
