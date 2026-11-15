// lexcode-expect: 2
// A cargo-mobile2 (tao and wry) app: the JNI bindings that start it inside its Android activity.
use tao::event_loop::EventLoop;

#[cfg(target_os = "android")]
fn android_bindings() {
    tao::android_binding!(com_example, wry_app, WryActivity, wry::android_setup, _start_app);
    wry::android_binding!(com_example, wry_app);
}

fn _start_app() {
    let event_loop: EventLoop<()> = EventLoop::new();
    let _ = event_loop;
}
