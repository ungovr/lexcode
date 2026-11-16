// lexcode-expect: 0
// A linfa model trained elsewhere and deserialized here: predicting is calling a model, not
// training one.
use linfa::prelude::*;
use linfa_logistic::FittedLogisticRegression;
use ndarray::Array2;

pub fn score(model_json: &str, features: Array2<f64>) -> Vec<bool> {
    let model: FittedLogisticRegression<f64, bool> = serde_json::from_str(model_json).unwrap();
    model.predict(&features).to_vec()
}
