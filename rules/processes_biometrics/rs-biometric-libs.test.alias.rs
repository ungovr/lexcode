// lexcode-expect: 3
use dlib_face_recognition as dfr;
use opencv as cv;

pub fn by_alias() -> cv::Result<()> {
    let _enc = dfr::FaceEncoderNetwork::open("model.dat");
    let _fisher = cv::face::FisherFaceRecognizer::create(0, f64::MAX)?;
    let _sf = cv::objdetect::FaceRecognizerSF::create("sface.onnx", "", 0, 0)?;
    Ok(())
}
