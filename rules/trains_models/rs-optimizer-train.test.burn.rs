// lexcode-expect: 6
// Burn: the optimizer configs, the Learner, and a custom loop that steps the optimizer on
// gradients. Burn's own examples import through nested `use` groups.
use burn as bn;
use burn::{
    optim::{AdamConfig, GradientsParams, Optimizer, SgdConfig},
    tensor::backend::AutodiffBackend,
    train::{metric::LossMetric, LearnerBuilder},
};

pub fn run<B: AutodiffBackend>(artifact_dir: &str, model: Model<B>, train: Loader<B>, valid: Loader<B>) {
    let optim = AdamConfig::new().init();
    let learner = LearnerBuilder::new(artifact_dir)
        .metric_train_numeric(LossMetric::new())
        .num_epochs(10)
        .build(model, optim, 1e-4);
    let _trained = learner.fit(train, valid);
}

pub fn custom_loop<B: AutodiffBackend>(mut model: Model<B>, batch: Batch<B>) -> Model<B> {
    let mut optim = SgdConfig::new().init();
    let loss = model.forward(batch.images).loss(batch.targets);
    let grads = loss.backward();
    let grads = GradientsParams::from_grads(grads, &model);
    model = optim.step(1e-3, model, grads);
    let _adamw = bn::optim::AdamWConfig::new().with_weight_decay(0.01).init::<B, Model<B>>();
    model
}
