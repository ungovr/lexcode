// lexcode-expect: 2
use objc2_local_authentication as la;
use tauri_plugin_biometric as bio;

pub fn run() {
    tauri::Builder::default().plugin(bio::init()).run(tauri::generate_context!()).unwrap();
}

pub fn policy() -> la::LAPolicy {
    la::LAPolicy::DeviceOwnerAuthenticationWithBiometrics
}
