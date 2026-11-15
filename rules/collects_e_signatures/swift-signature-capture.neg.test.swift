// lexcode-expect: 0
import UIKit
import PencilKit

// The nearest lookalikes: a drawing app's canvas exported as an image (a sketch, not a
// signature), and a signature canvas that is only shown and cleared, never read back.
final class SketchViewController: UIViewController {
    let canvasView = PKCanvasView()
    let signatureCanvas = PKCanvasView()

    func exportSketch() async throws -> Data? {
        let image = canvasView.drawing.image(from: canvasView.bounds, scale: 2)
        let saved = try await save(canvasView.drawing.dataRepresentation())
        return image.pngData() ?? saved
    }

    func clearSignature() {
        signatureCanvas.drawing = PKDrawing()
        signatureCanvas.tool = PKInkingTool(.pen, color: .black, width: 2)
    }

    func save(_ data: Data) async throws -> Data { data }
}
