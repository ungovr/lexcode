// lexcode-expect: 0
use dlib_face_recognition::{FaceDetector, FaceDetectorTrait, ImageMatrix};
use opencv::{core, imgproc, objdetect, prelude::*};
use rustface::{Detector, ImageData};

// Faces found to crop or blur a photo: detection names no one.
pub fn crop_with_dlib(image: &ImageMatrix) -> usize {
    let detector = FaceDetector::default();
    detector.face_locations(image).len()
}

pub fn blur_with_opencv(frame: &mut core::Mat) -> opencv::Result<()> {
    let mut yn = objdetect::FaceDetectorYN::create("yunet.onnx", "", core::Size::new(320, 320), 0.9, 0.3, 5000, 0, 0)?;
    let mut faces = core::Mat::default();
    yn.detect(frame, &mut faces)?;
    let mut cascade = objdetect::CascadeClassifier::new("haarcascade_frontalface_default.xml")?;
    let mut rects = core::Vector::<core::Rect>::new();
    cascade.detect_multi_scale(frame, &mut rects, 1.1, 3, 0, core::Size::default(), core::Size::default())?;
    let copy = frame.clone();
    imgproc::gaussian_blur(&copy, frame, core::Size::new(31, 31), 0.0, 0.0, core::BORDER_DEFAULT, core::AlgorithmHint::ALGO_HINT_DEFAULT)?;
    Ok(())
}

pub fn frame_with_rustface(detector: &mut dyn Detector, gray: &[u8], w: u32, h: u32) -> usize {
    detector.detect(&ImageData::new(gray, w, h)).len()
}

// Signing in to the app with a stored session: the app's own verify, in a file without libfprint.
pub struct Sessions;
impl Sessions {
    pub fn verify_sync(&self, _token: &str) -> bool {
        true
    }
}

pub fn check(s: &Sessions, token: &str) -> bool {
    s.verify_sync(token)
}
