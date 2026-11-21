// lexcode-expect: 0
import DiscordBM

// A cache that keeps only what is on screen (the default policy, said or not), and an app's own cache
// type with a policy of the same name.
struct BotCaches {
    func plain(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(gatewayManager: bot, intents: [.guilds], requestAllMembers: .disabled)
    }

    func normal(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(
            gatewayManager: bot,
            intents: [.guildMessages],
            requestAllMembers: .disabled,
            messageCachingPolicy: .normal(guilds: ["1234"])
        )
    }

    func ownCache() -> ImageCache {
        ImageCache(name: "avatars", messageCachingPolicy: .saveDeleted)
    }
}

struct ImageCache {
    let name: String
    let messageCachingPolicy: Policy
    enum Policy { case saveDeleted }
}
