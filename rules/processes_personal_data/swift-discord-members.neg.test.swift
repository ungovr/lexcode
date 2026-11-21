// lexcode-expect: 0
import DiscordBM

// A bot that reads messages and answers commands without asking for the member list or the member
// and presence events, a cache that requests none, and an app's own gateway type in a file without
// DiscordBM's import is in the .noimport fixture.
struct BotSetup {
    func gateway(httpClient: HTTPClient, token: String) async -> BotGatewayManager {
        await BotGatewayManager(
            httpClient: httpClient,
            token: token,
            intents: [.guilds, .guildMessages, .messageContent, .guildMessageReactions]
        )
    }

    func cache(bot: any GatewayManager) async -> DiscordCache {
        await DiscordCache(gatewayManager: bot, intents: [.guildMessages], requestAllMembers: .disabled)
    }
}

// An app's own settings type made with `.init` and a label of the same name, which does not open with
// DiscordCache's `gatewayManager:`.
struct SyncSettings {
    var requestAllMembers: Mode
    enum Mode { case enabled, disabled }
}

func defaults() -> SyncSettings {
    .init(requestAllMembers: .enabled)
}
