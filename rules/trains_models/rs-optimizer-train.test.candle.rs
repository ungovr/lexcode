// lexcode-expect: 5
// Candle: optimizers built over a VarMap's variables and a training loop.
use candle_core::{DType, Device, Tensor, D};
use candle_nn as cnn;
use candle_nn::{loss, ops, AdamW, Linear, Module, Optimizer, ParamsAdamW, VarBuilder, VarMap};

pub fn train(xs: &Tensor, ys: &Tensor) -> candle_core::Result<()> {
    let varmap = VarMap::new();
    let vb = VarBuilder::from_varmap(&varmap, DType::F32, &Device::Cpu);
    let model = candle_nn::linear(784, 10, vb.pp("ln1"))?;
    let mut opt = AdamW::new(varmap.all_vars(), ParamsAdamW::default())?;
    for _epoch in 0..10 {
        let logits = model.forward(xs)?;
        let loss = loss::nll(&ops::log_softmax(&logits, D::Minus1)?, ys)?;
        opt.backward_step(&loss)?;
    }
    Ok(())
}

pub fn train_sgd(varmap: &VarMap, layer: &Linear, xs: &Tensor, ys: &Tensor) -> candle_core::Result<()> {
    let mut sgd = cnn::SGD::new(varmap.all_vars(), 0.05)?;
    let loss = layer.forward(xs)?.sub(ys)?.sqr()?.mean_all()?;
    let grads = loss.backward()?;
    sgd.step(&grads)?;
    let _second = AdamW::new_lr(varmap.all_vars(), 3e-4)?;
    Ok(())
}
