// lexcode-expect: 4
// Dioxus launched as a mobile app: the launch builder reached through the prelude glob and by
// path, and dioxus-mobile's launch functions directly and through an alias.
use dioxus::prelude::*;
use dioxus_mobile as dm;

fn main() {
    LaunchBuilder::mobile().launch(app);
}

pub fn start_by_path() {
    dioxus::LaunchBuilder::mobile()
        .launch(app);
}

pub fn start_mobile_crate() {
    dioxus_mobile::launch(app);
    dm::launch_cfg(app, dm::Config::new());
}

fn app() -> Element {
    rsx! { "hello" }
}
