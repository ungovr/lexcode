// lexcode-expect: 8
import AVFoundation
import Foundation
import WhisperKit

final class OnDeviceDictation {
    private var pipe: WhisperKit?
    private let engine = AVAudioEngine()

    func load() async throws {
        let config = WhisperKitConfig(model: "large-v3", verbose: false)
        pipe = try await WhisperKit(config)
    }

    func loadDefault() async throws -> WhisperKit {
        try await WhisperKit.WhisperKit()
    }

    // The microphone tap is swift-microphone-capture's line, not this rule's.
    func listen() throws {
        engine.inputNode.installTap(onBus: 0, bufferSize: 4096, format: nil) { _, _ in }
        try engine.start()
    }

    func file(_ path: String) async throws -> String {
        guard let pipe else { return "" }
        let results = try await pipe.transcribe(audioPath: path)
        return results.map(\.text).joined()
    }

    func samples(_ audio: [Float]) async throws -> String {
        let options = DecodingOptions(task: .transcribe, language: "en")
        let results = try await pipe!
            .transcribe(
                audioArray: audio,
                decodeOptions: options
            )
        return results.first?.text ?? ""
    }

    func batch(_ paths: [String]) async -> Int {
        let results = await pipe?.transcribe(audioPaths: paths)
        return results?.count ?? 0
    }

    func batchWithResults(_ arrays: [[Float]]) async -> Int {
        let results = await pipe?.transcribeWithResults(audioArrays: arrays)
        return results?.count ?? 0
    }

    func language(_ path: String) async throws -> String {
        try await pipe!.detectLanguage(audioPath: path).language
    }

    func stream() async throws {
        guard let pipe, let tokenizer = pipe.tokenizer else { return }
        let transcriber = AudioStreamTranscriber(
            audioEncoder: pipe.audioEncoder,
            featureExtractor: pipe.featureExtractor,
            segmentSeeker: pipe.segmentSeeker,
            textDecoder: pipe.textDecoder,
            tokenizer: tokenizer,
            audioProcessor: pipe.audioProcessor,
            decodingOptions: DecodingOptions(),
            stateChangeCallback: { _, _ in }
        )
        try await transcriber.startStreamTranscription()
    }
}
