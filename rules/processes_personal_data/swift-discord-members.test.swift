// lexcode-expect: 5
import DiscordBM
import NIOPosix

struct BotSetup {
    func gateway(httpClient: HTTPClient, token: String) async -> BotGatewayManager {
        await BotGatewayManager(
            eventLoopGroup: MultiThreadedEventLoopGroup.singleton,
            httpClient: httpClient,
            token: token,
            intents: [
                .guilds,
                .guildMembers,
                .guildMessages,
            ]
        )
    }

    func cache(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(
            gatewayManager: bot,
            intents: [.guilds, .messageContent],
            requestAllMembers: .enabled,
            messageCachingPolicy: .normal
        )
    }

    func presences(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(gatewayManager: bot, intents: [.guildPresences], requestAllMembers: .enabledWithPresences(guilds: ["1"]))
    }

    func presenceGateway(httpClient: HTTPClient, token: String) async -> BotGatewayManager {
        await BotGatewayManager(httpClient: httpClient, token: token, intents: [Gateway.Intent.guildPresences])
    }
}
