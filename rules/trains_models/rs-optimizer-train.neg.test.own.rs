// lexcode-expect: 0
// The app's own optimizer, config, learner and gradient types, in a file with no
// deep-learning crate: a delivery-route planner and a game's undo history.
use std::collections::HashMap;

pub struct AdamConfig {
    pub stops: usize,
}

impl AdamConfig {
    pub fn new() -> Self {
        AdamConfig { stops: 0 }
    }
}

pub struct LearnerBuilder;

impl LearnerBuilder {
    pub fn new(name: &str) -> Self {
        let _ = name;
        LearnerBuilder
    }
}

pub struct AdamW;

impl AdamW {
    pub fn new(routes: Vec<u32>, budget: f64) -> Result<Self, String> {
        let _ = (routes, budget);
        Ok(AdamW)
    }
}

pub struct History {
    steps: HashMap<u32, String>,
}

impl History {
    pub fn backward(&mut self) {
        self.steps.clear();
    }

    pub fn backward_step(&mut self, n: u32) {
        self.steps.remove(&n);
    }
}

pub fn plan(mut history: History) {
    let config = AdamConfig::new();
    let learner = LearnerBuilder::new("routes");
    let opt = AdamW::new(vec![1, 2], 0.5);
    history.backward();
    history.backward_step(3);
    let _ = (config, learner, opt);
}
