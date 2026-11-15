// lexcode-expect: 8
use dlib_face_recognition::*;
use libfprint_rs::{FpContext, FpDevice, FpPrint};
use opencv::{core, face, prelude::*};
use opencv::{objdetect::FaceRecognizerSF, prelude::*};

pub fn encode(image: &ImageMatrix) -> FaceEncodings {
    let detector = FaceDetector::default();
    let landmarks = LandmarkPredictor::default();
    let encoder = FaceEncoderNetwork::default();
    let _from_file = FaceEncoderNetwork::open("dlib_face_recognition_resnet_model_v1.dat").unwrap();
    let faces = detector.face_locations(image);
    let marks: Vec<_> = faces.iter().map(|r| landmarks.face_landmarks(image, r)).collect();
    encoder.get_face_encodings(image, &marks, 0)
}

pub fn train(images: &core::Vector<core::Mat>, labels: &core::Vector<i32>) -> opencv::Result<()> {
    let mut lbph = face::LBPHFaceRecognizer::create(1, 8, 8, 8, f64::MAX)?;
    lbph.train(images, labels)?;
    let _eigen = face::EigenFaceRecognizer::create_def()?;
    let _older = <dyn face::FisherFaceRecognizer>::create(0, f64::MAX)?;
    Ok(())
}

pub fn sface(a: &core::Mat, b: &core::Mat) -> opencv::Result<f64> {
    let mut rec = FaceRecognizerSF::create("face_recognition_sface.onnx", "", 0, 0)?;
    let (mut fa, mut fb) = (core::Mat::default(), core::Mat::default());
    rec.feature(a, &mut fa)?;
    rec.feature(b, &mut fb)?;
    rec.match_(&fa, &fb, 0)
}

pub fn fingerprint() -> anyhow::Result<()> {
    let ctx = FpContext::new();
    let dev: &FpDevice = &ctx.devices()[0];
    dev.open_sync(None)?;
    let template = FpPrint::new(dev);
    let enrolled = dev.enroll_sync(template, None, None::<fn(&FpDevice, i32, Option<FpPrint>, Option<glib::Error>, &Option<()>)>, None)?;
    let _ok = dev.verify_sync(&enrolled, None, None::<fn(&FpDevice, Option<FpPrint>, FpPrint, Option<glib::Error>, &Option<()>)>, None, None)?;
    Ok(())
}
