// lexcode-expect: 2
// The speech handed to a completion closure whose capture list is not exactly `[weak self]`: one capture of
// another kind, or two captures.
import AVFoundation
import OpenAI

final class Narrator {
    let openAI = OpenAI(apiToken: "token")
    var narrationData: Data?
    var player: AVAudioPlayer?

    func narrate(_ query: AudioSpeechQuery) {
        openAI.audioCreateSpeech(query: query) { [unowned self] result in
            if case .success(let speech) = result {
                self.narrationData = speech.audio
            }
        }
        openAI.audioCreateSpeech(query: query) { [weak self, player] result in
            guard player == nil else { return }
            if case .success(let speech) = result {
                self?.narrationData = speech.audio
            }
        }
    }
}
