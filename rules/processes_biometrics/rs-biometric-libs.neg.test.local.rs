// lexcode-expect: 0
// The app's own types named like OpenCV's and dlib's, in a file that imports neither: a puzzle
// game's tile matcher and its encoder settings.
pub struct LBPHFaceRecognizer {
    radius: i32,
}

impl LBPHFaceRecognizer {
    pub fn create(radius: i32) -> Self {
        Self { radius }
    }
}

pub struct FaceEncoderNetwork;

impl FaceEncoderNetwork {
    pub fn open(_name: &str) -> Option<Self> {
        Some(FaceEncoderNetwork)
    }
}

pub fn tiles() -> (LBPHFaceRecognizer, Option<FaceEncoderNetwork>) {
    (LBPHFaceRecognizer::create(2), FaceEncoderNetwork::open("tiles"))
}
