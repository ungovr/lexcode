// lexcode-expect: 5
import UIKit
import SwiftSignatureView
import YPDrawSignatureView

// Signature-pad libraries: SwiftSignatureView and YPDrawSignatureView, each read back.
final class ConsentViewController: UIViewController {
    @IBOutlet weak var swiftPad: SwiftSignatureView!
    @IBOutlet weak var ypPad: YPDrawSignatureView!

    func save() async throws -> [UIImage?] {
        let a = swiftPad.signature
        let b = swiftPad.getCroppedSignature()
        let c = ypPad.getSignature(scale: 2)
        let d = try await process(ypPad.getCroppedSignature(
            scale: 1
        ))
        let e = ypPad.getCroppedSignature()
        return [a, b, c, d, e]
    }

    func process(_ image: UIImage?) async throws -> UIImage? { image }
}
