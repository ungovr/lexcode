// lexcode-expect: 0
// Data transforms fitted in a file that also names a linfa model crate: a scaler, a vectorizer,
// a TF-IDF vocabulary, a PCA projection and an ICA unmixing. Fitting a transform learns a
// preprocessing step, not a model; the logistic model here was trained elsewhere and only predicts.
use linfa::prelude::*;
use linfa_ica::fast_ica::FastIca;
use linfa_logistic::FittedLogisticRegression;
use linfa_preprocessing::linear_scaling::LinearScaler;
use linfa_preprocessing::tf_idf_vectorization::TfIdfVectorizer;
use linfa_preprocessing::CountVectorizer;
use linfa_reduction::Pca;
use ndarray::{Array1, Array2};

pub fn prepare(records: Array2<f64>, texts: Array1<String>, model: &FittedLogisticRegression<f64, bool>) {
    let ds = DatasetBase::from(records);
    let scaler = LinearScaler::standard().fit(&ds).unwrap();
    let vocab = CountVectorizer::params()
        .document_frequency(0.1, 1.0)
        .fit(&texts)
        .unwrap();
    let tfidf = linfa_preprocessing::tf_idf_vectorization::TfIdfVectorizer::default().fit(&texts).unwrap();
    let pca = Pca::params(2).fit(&ds).unwrap();
    let ica = FastIca::params().ncomponents(2).fit(&ds).unwrap();
    let _ = (scaler, vocab, tfidf, pca, ica, TfIdfVectorizer::default());
    let _ = model.predict(&ds);
}
