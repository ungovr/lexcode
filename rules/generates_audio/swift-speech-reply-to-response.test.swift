// lexcode-expect: 6
// An app that speaks with OpenAI's text-to-speech models (MacPaw and SwiftOpenAI clients) and a Vapor
// service that returns Amazon Polly speech.
import AVFoundation
import AWSPolly
import OpenAI
import SwiftOpenAI
import Vapor

final class Narrator {
    let openAI = OpenAI(apiToken: "token")
    let service = OpenAIServiceFactory.service(apiKey: "token")
    var player: AVAudioPlayer?
    var narrationData: Data?

    func narrate(_ query: AudioSpeechQuery) async throws {
        let result = try await openAI.audioCreateSpeech(query: query)
        player = try AVFoundation.AVAudioPlayer(data: result.audio)
        player?.play()
    }

    func narrateShort(_ query: AudioSpeechQuery) async throws {
        let result = try await openAI.audioCreateSpeech(query: query)
        player = try AVAudioPlayer(data: result.audio, fileTypeHint: "mp3")
        player?.play()
    }

    func narrateWeakly(_ query: AudioSpeechQuery) {
        openAI.audioCreateSpeech(query: query) { [weak self] result in
            if case .success(let speech) = result {
                self?.narrationData = speech.audio
            }
        }
    }

    func narrateLater(_ query: AudioSpeechQuery) {
        openAI.audioCreateSpeech(query: query) { result in
            if case .success(let speech) = result {
                self.narrationData = speech.audio
            }
        }
    }

    func narrateSwiftOpenAI(_ text: String) async throws {
        let parameters = AudioSpeechParameters(model: .tts1, input: text, voice: .shimmer)
        let audio = try await service.createSpeech(parameters: parameters).output
        player = try AVAudioPlayer(data: audio)
    }
}

struct SpeechController {
    let polly: PollyClient

    func speak(req: Request) async throws -> Response {
        let text = try req.content.decode(String.self)
        let output = try await polly.synthesizeSpeech(input: SynthesizeSpeechInput(engine: .neural, outputFormat: .mp3, text: text, voiceId: .joanna))
        let bytes = try await output.audioStream?.readData() ?? Data()
        return Response(status: .ok, body: .init(data: bytes))
    }
}
