// lexcode-expect: 0
// A search service that only preprocesses: no linfa model crate is imported, so a fit on a value
// the engine cannot type (a scaler built on another line) is not read as training.
use linfa::prelude::*;
use linfa_preprocessing::norm_scaling::NormScaler;
use linfa_reduction::Pca;
use ndarray::Array2;

pub fn normalise(records: Array2<f64>) -> Array2<f64> {
    let ds = DatasetBase::from(records);
    let scaler = NormScaler::l2();
    let reduce = Pca::params(8);
    let _projection = reduce.fit(&ds).unwrap();
    scaler.transform(ds).records
}
