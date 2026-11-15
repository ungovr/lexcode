// lexcode-expect: 0
use objc2_foundation::NSString;
use objc2_local_authentication::{LAContext, LAPolicy};

// A policy that accepts the device passcode is not biometrics-only.
pub fn unlock(reply: &block2::Block<dyn Fn(objc2::runtime::Bool, *mut objc2_foundation::NSError)>) {
    let ctx = unsafe { LAContext::new() };
    let reason = NSString::from_str("Unlock");
    unsafe { ctx.evaluatePolicy_localizedReason_reply(LAPolicy::DeviceOwnerAuthentication, &reason, reply) };
}

// The app's own settings screen, with an accessor named `biometric` and an enum variant of the same
// name as Apple's, in a file without the Tauri plugin.
pub enum Policy {
    DeviceOwnerAuthenticationWithBiometrics,
}

pub struct Settings;
impl Settings {
    pub fn biometric(&self) -> Toggle {
        Toggle
    }
}

pub struct Toggle;
impl Toggle {
    pub fn authenticate(&self, _reason: &str) -> bool {
        false
    }
}

pub fn prefs(s: &Settings) -> (bool, Policy) {
    (s.biometric().authenticate("x"), Policy::DeviceOwnerAuthenticationWithBiometrics)
}
