// lexcode-expect: 5
// The DDBKit starter's shape (DDBKit/DDBKit Example/Sources/ExampleBot/Bot.swift, llsc12/darkbulb): a
// file that imports only DDBKit, which re-exports DiscordBM, makes the cache with `.init(...)` or
// `DiscordCache.init(...)` or a bare `DiscordCache(...)`, and one module-qualified by DiscordGateway.
import DDBKit
import DDBKitUtilities
import Foundation

final class ExampleBot {
    var cache: DiscordCache!

    func boot(bot: any GatewayManager) async {
        cache = await .init(
            gatewayManager: bot,
            intents: .all,  // it's better to minimise cached data to your needs
            requestAllMembers: .enabledWithPresences,
            messageCachingPolicy: .saveEditHistoryAndDeleted
        )
    }

    func typed(bot: any GatewayManager) async -> DiscordCache {
        let made: DiscordCache = await .init(gatewayManager: bot, intents: [.guildMessages], requestAllMembers: .disabled, messageCachingPolicy: .saveEditHistory(guilds: ["1"], channels: .all))
        return made
    }

    func spelled(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache.init(gatewayManager: bot, intents: [.guilds], requestAllMembers: .enabled, messageCachingPolicy: .saveDeleted)
    }

    func bare(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(gatewayManager: bot, intents: [.guilds], requestAllMembers: .disabled, messageCachingPolicy: .saveEditHistory)
    }

    func gateway(bot: any GatewayManager) async -> DiscordCache {
        await DiscordGateway.DiscordCache(gatewayManager: bot, intents: [.guilds], requestAllMembers: .disabled, messageCachingPolicy: .saveDeleted)
    }
}
