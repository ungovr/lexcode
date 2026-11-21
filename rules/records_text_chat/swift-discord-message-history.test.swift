// lexcode-expect: 4
import DiscordBM

struct BotCaches {
    func moderation(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(
            gatewayManager: bot,
            intents: [.guilds, .guildMembers, .messageContent, .guildMessages],
            requestAllMembers: .enabled,
            messageCachingPolicy: .saveEditHistoryAndDeleted
        )
    }

    func deletedOnly(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(gatewayManager: bot, intents: .all, requestAllMembers: .disabled, messageCachingPolicy: .saveDeleted)
    }

    func someGuilds(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(
            gatewayManager: bot,
            intents: [.guildMessages],
            requestAllMembers: .disabled,
            messageCachingPolicy: .saveEditHistory(guilds: ["1234"]),
            itemsLimit: .constant(10_000)
        )
    }

    func qualified(bot: any GatewayManager) async -> DiscordCache {
        await DiscordBM.DiscordCache(
            gatewayManager: bot,
            intents: [.guildMessages],
            requestAllMembers: .disabled,
            messageCachingPolicy: DiscordCache.MessageCachingPolicy.saveDeleted
        )
    }
}
