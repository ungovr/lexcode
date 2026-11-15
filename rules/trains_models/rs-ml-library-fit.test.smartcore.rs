// lexcode-expect: 2
// smartcore: a forest and a regression fitted to the app's data, the second with the import
// inside the function.
use smartcore::ensemble::random_forest_classifier::RandomForestClassifier;
use smartcore::linalg::basic::matrix::DenseMatrix;

pub fn classify(x: &DenseMatrix<f64>, y: &Vec<u32>) {
    let forest = RandomForestClassifier::fit(x, y, Default::default()).unwrap();
    let _ = forest;
}

pub fn regress(x: &DenseMatrix<f64>, y: &Vec<f64>) {
    use smartcore::linear::linear_regression::{LinearRegression, LinearRegressionParameters};
    let lr = LinearRegression::fit(x, y, LinearRegressionParameters::default()).unwrap();
    let _ = lr;
}
