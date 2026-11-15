// lexcode-expect: 4
// linfa: models fitted to the app's own dataset.
use linfa::prelude::*;
use linfa_bayes::GaussianNb;
use linfa_clustering as clustering;
use linfa_logistic::LogisticRegression;
use linfa_preprocessing::linear_scaling::LinearScaler;
use linfa_trees::{DecisionTree, SplitQuality};
use ndarray::{Array1, Array2};

pub fn churn_model(records: Array2<f64>, targets: Array1<bool>) -> Result<(), linfa::Error> {
    let train = Dataset::new(records, targets);
    // The scaler's fit learns a transform and is not counted; the two model fits below are.
    let _scaler = LinearScaler::standard().fit(&train)?;
    let model = LogisticRegression::default().max_iterations(150).fit(&train)?;
    let tree = DecisionTree::params()
        .split_quality(SplitQuality::Gini)
        .max_depth(Some(3))
        .fit(&train)?;
    let _ = (model, tree);
    Ok(())
}

pub fn segments(records: Array2<f64>) {
    let ds = DatasetBase::from(records);
    let _kmeans = clustering::KMeans::params(4).fit(&ds).expect("kmeans");
}

pub fn incremental(batch: &Dataset<f64, usize>) {
    let _nb = GaussianNb::params().fit_with(None, batch).unwrap();
}
