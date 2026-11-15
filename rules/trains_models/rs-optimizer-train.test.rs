// lexcode-expect: 5
// tch (the PyTorch bindings): optimizers built on a VarStore and a training loop.
use tch as torch;
use tch::{nn, nn::Module, nn::OptimizerConfig, Device, Tensor};

pub fn train_classifier(xs: &Tensor, ys: &Tensor) -> Result<(), tch::TchError> {
    let vs = nn::VarStore::new(Device::cuda_if_available());
    let net = nn::linear(vs.root(), 784, 10, Default::default());
    let mut opt = nn::Adam::default().build(&vs, 1e-3)?;
    for _epoch in 1..200 {
        let loss = net.forward(xs).cross_entropy_for_logits(ys);
        opt.backward_step(&loss);
    }
    Ok(())
}

pub fn fine_tune_head(vs: &nn::VarStore, xs: &Tensor, ys: &Tensor) -> Result<(), tch::TchError> {
    let mut sgd = torch::nn::Sgd::default().build(vs, 1e-2)?;
    let mut adamw = nn::adamw(0.9, 0.999, 0.01)
        .build(vs, 1e-4)?;
    let loss = xs.mse_loss(ys, tch::Reduction::Mean);
    sgd.zero_grad();
    loss.backward();
    sgd.step();
    adamw.step();
    Ok(())
}
