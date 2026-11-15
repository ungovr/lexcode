// lexcode-expect: 0
// A `fit` in a file with no machine-learning crate: an image resized to fit a frame, and an
// app's own curve type whose fit is a lookup.
use image::imageops::FilterType;
use image::DynamicImage;

pub struct Frame {
    pub width: u32,
    pub height: u32,
}

impl Frame {
    pub fn fit(&self, img: &DynamicImage) -> DynamicImage {
        img.resize(self.width, self.height, FilterType::Lanczos3)
    }
}

pub struct Curve;

impl Curve {
    pub fn fit(points: &[(f64, f64)]) -> Option<f64> {
        points.first().map(|p| p.1)
    }
}

pub fn thumbnail(frame: &Frame, img: &DynamicImage) -> DynamicImage {
    let _ = Curve::fit(&[(0.0, 1.0)]);
    frame.fit(img)
}
