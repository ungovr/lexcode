// lexcode-expect: 0
// The app's own fine_tuning and create_training_job methods, in a file with no model-hosting
// SDK: a radio's frequency tuner and a gym's schedule.
pub struct Tuner {
    pub step_khz: u32,
}

pub struct Session;

impl Session {
    pub fn create(&self, khz: u32) -> u32 {
        khz
    }
}

impl Tuner {
    pub fn fine_tuning(&self) -> Session {
        Session
    }
}

pub struct Gym;

impl Gym {
    pub fn create_training_job(&self) -> String {
        "leg day".to_owned()
    }

    pub fn create_fine_tuning_job(&self, coach: &str) -> String {
        coach.to_owned()
    }
}

pub fn adjust(tuner: &Tuner, gym: &Gym) -> u32 {
    let _ = gym.create_training_job();
    let _ = gym.create_fine_tuning_job("sam");
    tuner.fine_tuning().create(tuner.step_khz)
}
