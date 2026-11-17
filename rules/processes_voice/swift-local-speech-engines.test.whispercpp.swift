// lexcode-expect: 5
import Foundation
import whisper

actor WhisperContext {
    private var context: OpaquePointer

    init(context: OpaquePointer) {
        self.context = context
    }

    deinit {
        whisper_free(context)
    }

    func fullTranscribe(samples: [Float]) -> String {
        var params = whisper_full_default_params(WHISPER_SAMPLING_GREEDY)
        params.print_realtime = false
        samples.withUnsafeBufferPointer { samples in
            if whisper_full(context, params, samples.baseAddress, Int32(samples.count)) != 0 {
                print("Failed to run the model")
            }
        }
        var transcription = ""
        for i in 0..<whisper_full_n_segments(context) {
            transcription += String(cString: whisper_full_get_segment_text(context, i))
        }
        return transcription
    }

    func parallel(samples: [Float]) -> Int32 {
        let params = whisper_full_default_params(WHISPER_SAMPLING_BEAM_SEARCH)
        return samples.withUnsafeBufferPointer { buffer in
            whisper_full_parallel(context, params, buffer.baseAddress, Int32(buffer.count), 2)
        }
    }

    static func createContext(path: String) throws -> WhisperContext {
        var params = whisper_context_default_params()
        params.flash_attn = true
        guard let context = whisper_init_from_file_with_params(path, params) else {
            throw NSError(domain: "whisper", code: 1)
        }
        return WhisperContext(context: context)
    }

    static func fromBuffer(_ data: Data) -> OpaquePointer? {
        data.withUnsafeBytes { raw in
            whisper_init_from_buffer_with_params(UnsafeMutableRawPointer(mutating: raw.baseAddress), raw.count, whisper_context_default_params())
        }
    }

    func detect(threads: Int32) -> Int32 {
        whisper_lang_auto_detect(context, 0, threads, nil)
    }
}
