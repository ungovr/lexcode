// lexcode-expect: 0
// No speech model is imported. The app has its own OpenAI type with audioCreateSpeech and its own
// synthesizeSpeech, and plays back a person's own recording, which the definition leaves out.
import AVFoundation
import Vapor

struct OpenAI {
    func audioCreateSpeech(query: String) async throws -> Data { Data(query.utf8) }
}

struct VoiceMemos {
    func synthesizeSpeech(input: String) async throws -> Data { Data() }
}

final class MemoPlayer {
    let openAI = OpenAI()
    let memos = VoiceMemos()
    var player: AVAudioPlayer?
    var speechData: Data?

    func playChime() async throws {
        let data = try await openAI.audioCreateSpeech(query: "chime")
        player = try AVAudioPlayer(data: data)
    }

    func playRecording(at url: URL) throws {
        player = try AVAudioPlayer(contentsOf: url)
        player?.play()
    }

    func cache() async throws {
        speechData = try await memos.synthesizeSpeech(input: "memo")
    }

    func serve(req: Request) async throws -> Response {
        let data = try await memos.synthesizeSpeech(input: "memo")
        return Response(status: .ok, body: .init(data: data))
    }
}
