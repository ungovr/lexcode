// lexcode-expect: 0
// No AVFoundation import. The app has its own AVSpeechUtterance type (a queued caption, never spoken),
// and plays a sound file it ships.
import AudioToolbox
import Foundation

struct AVSpeechUtterance {
    let string: String
    init(string: String) { self.string = string }
}

final class Captions {
    var queue: [AVSpeechUtterance] = []

    func add(_ text: String) {
        queue.append(AVSpeechUtterance(string: text))
    }

    func chime(_ id: SystemSoundID) {
        AudioServicesPlaySystemSound(id)
    }
}
