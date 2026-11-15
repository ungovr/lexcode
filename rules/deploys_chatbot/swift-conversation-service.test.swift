// lexcode-expect: 4
import Foundation
import AWSLexRuntimeV2
import AWSLexRuntimeService

// What a person typed goes to a hosted dialogue service (an Amazon Lex bot, a Dialogflow agent),
// which answers in natural language.
final class SupportBot {
    let lex: LexRuntimeV2Client
    let legacy: LexRuntimeClient

    init(lex: LexRuntimeV2Client, legacy: LexRuntimeClient) {
        self.lex = lex
        self.legacy = legacy
    }

    func ask(_ text: String, session: String) async throws -> String? {
        let output = try await lex.recognizeText(input: RecognizeTextInput(
            botAliasId: "TSTALIASID",
            botId: "BOT123",
            localeId: "en_US",
            sessionId: session,
            text: text
        ))
        return output.messages?.first?.content
    }

    func askShort(_ text: String, session: String) async throws -> String? {
        let output = try await lex.recognizeText(input: .init(botAliasId: "A", botId: "B", localeId: "en_US", sessionId: session, text: text))
        return output.messages?.first?.content
    }

    func askLegacy(_ text: String, user: String) async throws -> String? {
        let output = try await legacy.postText(input: PostTextInput(botAlias: "prod", botName: "Support", inputText: text, userId: user))
        return output.message
    }

    func dialogflowURL(project: String, session: String) -> URL? {
        URL(string: "https://dialogflow.googleapis.com/v2/projects/\(project)/agent/sessions/\(session):detectIntent")
    }
}
