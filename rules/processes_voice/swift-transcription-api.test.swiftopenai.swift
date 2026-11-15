// lexcode-expect: 2
@preconcurrency import SwiftOpenAI
import SwiftUI

@MainActor
final class MeetingNotesModel: ObservableObject {
    @Published var text = ""
    private let service = OpenAIServiceFactory.service(apiKey: "sk-test")

    func transcribe(_ data: Data) async throws {
        let parameters = AudioTranscriptionParameters(fileName: "note.m4a", file: data)
        text = try await service.createTranscription(parameters: parameters).text
    }

    func translate(_ data: Data) async throws {
        let parameters = AudioTranslationParameters(fileName: "note.m4a", file: data)
        text = try await service
            .createTranslation(parameters: parameters)
            .text
    }
}
