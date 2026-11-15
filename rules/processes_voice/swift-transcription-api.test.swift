// lexcode-expect: 5
import Foundation
import OpenAI

final class VoiceNotes {
    private let openAI = OpenAI(apiToken: "sk-test")

    func transcribe(_ audio: Data, completion: @escaping (String) -> Void) {
        let query = AudioTranscriptionQuery(file: audio, fileType: .m4a, model: .whisper_1)
        openAI.audioTranscriptions(query: query) { result in
            if case .success(let transcript) = result { completion(transcript.text) }
        }
    }

    func translate(_ audio: Data) async throws -> String {
        let query = AudioTranslationQuery(file: audio, fileType: .m4a, model: .whisper_1)
        let result = try await openAI
            .audioTranslations(query: query)
        return result.text
    }

    // The endpoints, sent with URLSession
    let deepgram = URL(string: "https://api.deepgram.com/v1/listen?model=nova-3&smart_format=true")!

    func whisperRequest(base: String) -> URLRequest {
        var request = URLRequest(url: URL(string: "\(base)/v1/audio/transcriptions")!)
        request.url = URL(string: "https://api.openai.com/v1/audio/transcriptions")
        request.httpMethod = "POST"
        return request
    }

    func assemblyAI(id: String) -> URL {
        URL(string: "https://api.assemblyai.com/v2/transcript/\(id)")!
    }
}
