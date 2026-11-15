// lexcode-expect: 0
// Inference only: weights trained by somebody else are loaded and run, and nothing updates them.
use candle_core::{Device, Tensor};
use candle_nn::{Linear, Module, VarBuilder};
use tch::{nn, nn::ModuleT, CModule, Kind};

pub fn classify(path: &str, image: &tch::Tensor) -> tch::Tensor {
    let model = CModule::load(path).unwrap();
    tch::no_grad(|| model.forward_ts(&[image]).unwrap().softmax(-1, Kind::Float))
}

pub fn embed(vb: VarBuilder, input: &Tensor) -> candle_core::Result<Tensor> {
    let layer = Linear::new(vb.get((384, 768), "weight")?, None);
    layer.forward(input)
}

pub fn eval_mode(vs: &nn::VarStore, net: &impl ModuleT, xs: &tch::Tensor) -> tch::Tensor {
    let _ = vs;
    net.forward_t(xs, false)
}

pub fn device() -> Device {
    Device::Cpu
}
