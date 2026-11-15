// lexcode-expect: 7
import AVFoundation

final class VoiceMemoRecorder {
    private let engine = AVAudioEngine()
    private var recorder: AVAudioRecorder?

    func startMemo(to url: URL) throws {
        let settings: [String: Any] = [AVFormatIDKey: Int(kAudioFormatMPEG4AAC), AVSampleRateKey: 44_100]
        recorder = try AVAudioRecorder(url: url, settings: settings)
        recorder?.record()
    }

    func startMemo(to url: URL, format: AVAudioFormat) throws {
        let memo = try AVAudioRecorder(
            url: url,
            format: format
        )
        memo.record()
    }

    func listen() throws {
        engine.inputNode.installTap(onBus: 0, bufferSize: 4096, format: nil) { buffer, _ in
            self.levels(buffer)
        }
        try engine.start()
    }

    func listenThroughLocal() throws {
        let input = engine.inputNode
        let format = input.outputFormat(forBus: 0)
        input.installTap(onBus: 0, bufferSize: 4096, format: format, block: { buffer, _ in
            self.levels(buffer)
        })
        try engine.start()
    }

    func addMicrophone(to session: AVCaptureSession) throws {
        guard let mic = AVCaptureDevice.default(for: .audio) else { return }
        session.addInput(try AVCaptureDeviceInput(device: mic))
        if let builtIn = AVCaptureDevice.default(.builtInMicrophone,
                                                 for: .audio,
                                                 position: .unspecified) {
            print(builtIn.localizedName)
        }
    }

    func startMemoAsync(to url: URL) async throws {
        let memo = try await prepared(AVAudioRecorder(url: url, settings: [AVNumberOfChannelsKey: 1]))
        memo.record()
    }

    private func prepared(_ recorder: AVAudioRecorder) async throws -> AVAudioRecorder {
        recorder.prepareToRecord()
        return recorder
    }

    private func levels(_ buffer: AVAudioPCMBuffer) {
        print(buffer.frameLength)
    }
}
