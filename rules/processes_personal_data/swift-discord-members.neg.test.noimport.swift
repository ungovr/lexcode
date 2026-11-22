// lexcode-expect: 0
import Foundation

// An app's own gateway type with an intents list of the same names, in a file that does not import
// DiscordBM.
struct BotGatewayManager {
    init(token: String, intents: [Intent]) {}
    enum Intent { case guildMembers, guildPresences }
}

func connect() {
    _ = BotGatewayManager(token: "t", intents: [.guildMembers, .guildPresences])
}
