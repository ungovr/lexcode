// lexcode-expect: 2
// A native Android app: android-activity's entry point (the form Slint, egui and winit apps
// use), and an older ndk-glue app's main.
use android_activity::{AndroidApp, MainEvent, PollEvent};

#[no_mangle]
fn android_main(app: AndroidApp) {
    loop {
        app.poll_events(None, |event| {
            if let PollEvent::Main(MainEvent::Destroy) = event {
                return;
            }
        });
    }
}

#[cfg_attr(target_os = "android", ndk_glue::main(backtrace = "on"))]
pub fn main() {
    println!("started");
}
