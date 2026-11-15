// lexcode-expect: 1
// A winit app's Android entry point, with the activity module reached through an alias.
use winit::event_loop::EventLoop;
use winit::platform::android::activity as act;
use winit::platform::android::EventLoopBuilderExtAndroid;

#[no_mangle]
pub extern "C" fn android_main(app: act::AndroidApp) {
    let event_loop = EventLoop::builder().with_android_app(app).build().unwrap();
    run(event_loop);
}

fn run(event_loop: EventLoop<()>) {
    let _ = event_loop;
}
