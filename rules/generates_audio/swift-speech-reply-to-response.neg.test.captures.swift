// lexcode-expect: 0
// Completion closures with capture lists on calls that are not a model's: an app's own recordings client in
// a file that imports OpenAI, whose audio reaches the player.
import AVFoundation
import OpenAI

final class RecordingsClient {
    func recording(query: String, completion: @escaping (Result<Data, Error>) -> Void) {
        completion(.success(Data(query.utf8)))
    }
}

final class Playback {
    let client = RecordingsClient()
    var narrationData: Data?
    var player: AVAudioPlayer?

    func load() {
        client.recording(query: "memo") { [unowned self] result in
            if case .success(let data) = result { narrationData = data }
        }
        client.recording(query: "memo") { [weak self, player] result in
            if case .success(let data) = result, player == nil { self?.narrationData = data }
        }
    }
}
