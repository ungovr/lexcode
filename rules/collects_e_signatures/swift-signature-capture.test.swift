// lexcode-expect: 4
import SwiftUI
import UIKit
import PencilKit

// A waiver screen that reads back the signature a person drew with PencilKit, and a SwiftUI
// signature pad that exports its drawing.
final class WaiverViewController: UIViewController {
    let signatureCanvas = PKCanvasView()

    func submit() async throws -> Data? {
        let png = signatureCanvas.drawing.image(from: signatureCanvas.bounds, scale: 1).pngData()
        let stroke = self.signatureCanvas.drawing.dataRepresentation()
        let awaited = try await upload(signatureCanvas
            .drawing
            .dataRepresentation())
        return png ?? stroke ?? awaited
    }

    func upload(_ data: Data) async throws -> Data? { data }
}

struct SignaturePadView: UIViewRepresentable {
    let canvasView: PKCanvasView

    func makeUIView(context: Context) -> PKCanvasView { canvasView }
    func updateUIView(_ uiView: PKCanvasView, context: Context) {}

    func exportImage() -> UIImage {
        canvasView.drawing.image(from: canvasView.bounds, scale: UIScreen.main.scale)
    }
}
