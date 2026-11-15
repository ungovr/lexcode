// lexcode-expect: 0
import Foundation
import Vision

// Lookalikes with no dialogue service: text recognition on an image (Vision's
// VNRecognizeTextRequest), an app's own `recognizeText` helper and its own RecognizeTextInput type
// in a file without the Lex import, and a Dialogflow admin call that lists intents (no session,
// nobody talking to the agent).
struct RecognizeTextInput {
    var text: String
}

final class Scanner {
    func read(_ image: CGImage) throws -> [String] {
        let request = VNRecognizeTextRequest()
        try VNImageRequestHandler(cgImage: image).perform([request])
        return request.results?.compactMap { $0.topCandidates(1).first?.string } ?? []
    }

    func recognizeText(input: RecognizeTextInput) -> String {
        input.text.uppercased()
    }

    func local(_ text: String) -> String {
        recognizeText(input: RecognizeTextInput(text: text))
    }

    func intentsURL(project: String) -> URL? {
        URL(string: "https://dialogflow.googleapis.com/v2/projects/\(project)/agent/intents")
    }
}
