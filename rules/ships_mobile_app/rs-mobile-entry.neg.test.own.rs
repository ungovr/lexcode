// lexcode-expect: 0
// The app's own LaunchBuilder with a `mobile` constructor and its own launch functions, in a
// file with no UI framework: a rocket-launch scheduler for a mobile pad.
pub struct LaunchBuilder {
    pub pad: &'static str,
}

impl LaunchBuilder {
    pub fn mobile() -> Self {
        LaunchBuilder { pad: "mobile-1" }
    }
}

pub mod mobile {
    pub fn launch(window_minutes: u32) -> u32 {
        window_minutes
    }
}

pub fn schedule() -> u32 {
    let builder = LaunchBuilder::mobile();
    let _ = builder.pad;
    mobile::launch(30)
}
