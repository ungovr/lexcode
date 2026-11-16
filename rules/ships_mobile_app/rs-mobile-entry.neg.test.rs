// lexcode-expect: 0
// A desktop app and a server that only talk about Android: a winit window opened from main, a
// Dioxus desktop launch, an admin service's own AndroidApp record, a build helper named
// android_main that takes a target triple, and uniffi bindings (a library others build into
// their own app, on any platform).
use dioxus::prelude::*;
use winit::event_loop::EventLoop;

uniffi::setup_scaffolding!();

pub struct AndroidApp {
    pub package_name: String,
    pub version_code: u32,
}

pub fn register(app: AndroidApp) -> String {
    format!("{}@{}", app.package_name, app.version_code)
}

pub fn android_main(target: &str) -> String {
    format!("cargo build --target {target}")
}

pub fn android_main_menu() -> Vec<&'static str> {
    vec!["Settings", "About"]
}

// Before 2.0 the mobile build used `#[bevy_main]` and
// #[cfg_attr(target_os = "android", ndk_glue::main)]; both were removed with it.
const HELP: &str = "#[bevy_main] is only for the phone build";

#[tokio::main]
async fn main() {
    let _ = HELP;
    let event_loop = EventLoop::new().unwrap();
    let _ = event_loop;
    dioxus::LaunchBuilder::desktop().launch(app);
    dioxus_desktop::launch(app);
}

fn app() -> Element {
    rsx! { "hello" }
}
