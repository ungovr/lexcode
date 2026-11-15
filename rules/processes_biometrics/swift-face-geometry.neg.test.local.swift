// lexcode-expect: 0
import SwiftUI

// The app's own types with Apple's short names, in a file without Vision or ARKit: a dice game's
// face-of-the-die tracker.
struct VNDetectFaceLandmarksRequest {
    let sides: Int
}

final class ARFaceTrackingConfiguration {
    var faces: [Int] = []
}

struct DiceView: View {
    let request = VNDetectFaceLandmarksRequest(sides: 6)
    let tracking = ARFaceTrackingConfiguration()

    var body: some View {
        Text("\(request.sides) \(tracking.faces.count)")
    }
}
