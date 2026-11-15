// lexcode-expect: 0
import Foundation

// The app's own track and renderer with LiveKit's method name, in a file without `import LiveKit`:
// a music sequencer, not a call.
protocol AudioRenderer: AnyObject {}

final class SequencerTrack {
    private var renderers: [AudioRenderer] = []

    func add(audioRenderer: AudioRenderer) {
        renderers.append(audioRenderer)
    }
}

final class Waveform: AudioRenderer {
    func attach(to track: SequencerTrack) {
        track.add(audioRenderer: self)
    }
}
