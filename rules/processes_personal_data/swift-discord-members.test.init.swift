// lexcode-expect: 11
// The DDBKit starter's shape (DDBKit/DDBKit Example/Sources/ExampleBot/Bot.swift, llsc12/darkbulb): a
// file that imports only DDBKit, which re-exports DiscordBM, makes the gateway and the cache with
// `.init(...)`, `DiscordCache.init(...)` or a bare `DiscordCache(...)`.
import DDBKit
import DDBKitUtilities
import Foundation

final class ExampleBot {
    var bot: BotGatewayManager!
    var cache: DiscordCache!

    func boot(token: String) async {
        bot = await BotGatewayManager(token: token, intents: [.guildMessages, .guildMembers])
        cache = await .init(
            gatewayManager: bot,
            intents: .all,
            requestAllMembers: .enabledWithPresences,
            messageCachingPolicy: .saveEditHistoryAndDeleted
        )
    }

    func spelled(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache.init(gatewayManager: bot, intents: [.guildPresences], requestAllMembers: .disabled)
    }

    func bare(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(gatewayManager: bot, intents: [.guilds], requestAllMembers: .enabled(guilds: ["1"]))
    }

    func gateway(bot: any GatewayManager) async -> DiscordCache {
        await DiscordGateway.DiscordCache(gatewayManager: bot, intents: [Gateway.Intent.guildMembers], requestAllMembers: .disabled)
    }

    // Each construction form once, with the member request or the member intent alone.
    func forms(bot: any GatewayManager) async {
        _ = await DiscordBM.DiscordCache(gatewayManager: bot, intents: [.guilds], requestAllMembers: .enabled)
        _ = await DiscordGateway.DiscordCache(gatewayManager: bot, intents: [.guilds], requestAllMembers: .enabled)
        _ = await DiscordCache.init(gatewayManager: bot, intents: [.guilds], requestAllMembers: .enabled)
        _ = await DiscordCache(gatewayManager: bot, intents: [.guildMembers], requestAllMembers: .disabled)
        _ = await DiscordBM.DiscordCache(gatewayManager: bot, intents: [.guildMembers], requestAllMembers: .disabled)
        cache = await .init(gatewayManager: bot, intents: [.guildMembers], requestAllMembers: .disabled)
    }
}
