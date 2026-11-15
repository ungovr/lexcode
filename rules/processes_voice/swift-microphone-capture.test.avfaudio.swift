// lexcode-expect: 3
import AVFAudio

// AVFAudio imported on its own (watchOS and lean targets do), not through AVFoundation.
actor VoiceNoteStore {
    private var recorders: [AVAudioRecorder] = []

    func keep(_ recorder: AVAudioRecorder) throws {
        recorder.record()
        recorders.append(recorder)
    }
}

struct WatchVoiceNote {
    let engine: AVAudioEngine

    func record(to url: URL) throws -> AVAudioRecorder {
        let recorder = try AVAudioRecorder(url: url, settings: [AVNumberOfChannelsKey: 1])
        recorder.record(forDuration: 30)
        return recorder
    }

    func recordAsync(to url: URL, store: VoiceNoteStore) async throws {
        try await store.keep(AVAudioRecorder(url: url, settings: [AVNumberOfChannelsKey: 1]))
    }

    func stream(handler: @escaping (AVAudioPCMBuffer) -> Void) throws {
        engine.inputNode.installTap(onBus: 0, bufferSize: 1024, format: nil) { buffer, _ in handler(buffer) }
        try engine.start()
    }
}
