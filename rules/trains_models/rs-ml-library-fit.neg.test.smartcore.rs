// lexcode-expect: 0
// smartcore transforms fitted in a file that also names a model module: a scaler, a one-hot
// encoder, PCA and SVD. The forest here was trained elsewhere and only predicts.
use smartcore::decomposition::pca::{PCAParameters, PCA};
use smartcore::decomposition::svd::{SVDParameters, SVD};
use smartcore::ensemble::random_forest_classifier::RandomForestClassifier;
use smartcore::linalg::basic::matrix::DenseMatrix;
use smartcore::preprocessing::categorical::{OneHotEncoder, OneHotEncoderParams};
use smartcore::preprocessing::numerical::{StandardScaler, StandardScalerParameters};

pub fn prepare(x: &DenseMatrix<f64>, forest: &RandomForestClassifier<f64, u32, DenseMatrix<f64>, Vec<u32>>) {
    let scaler = StandardScaler::fit(x, StandardScalerParameters::default()).unwrap();
    let encoder = OneHotEncoder::fit(x, OneHotEncoderParams::from_cat_idx(&[0])).unwrap();
    let pca = PCA::fit(x, PCAParameters::default().with_n_components(2)).unwrap();
    let svd = smartcore::decomposition::svd::SVD::fit(x, SVDParameters::default()).unwrap();
    let _ = (scaler, encoder, pca, svd);
    let _ = forest.predict(x);
}
