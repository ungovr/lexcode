// lexcode-expect: 2
import Foundation

// whisper.cpp reached through a bridging header: no import names it, and its prefixed C functions
// are matched by name.
final class BridgedWhisper {
    private let ctx: OpaquePointer?

    init(modelPath: String) {
        ctx = whisper_init_from_file(modelPath)
    }

    func run(_ samples: [Float], state: OpaquePointer?) -> Bool {
        let params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY)
        return whisper_full_with_state(ctx, state, params, samples, Int32(samples.count)) == 0
    }
}
