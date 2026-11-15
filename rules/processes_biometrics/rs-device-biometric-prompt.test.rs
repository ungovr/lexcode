// lexcode-expect: 3
use objc2_foundation::NSString;
use objc2_local_authentication::{LAContext, LAPolicy};
use tauri::AppHandle;
use tauri_plugin_biometric::{AuthOptions, BiometricExt};

pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_biometric::init())
        .run(tauri::generate_context!())
        .expect("error while running app");
}

#[tauri::command]
pub fn unlock_vault(app: AppHandle) -> Result<(), String> {
    app.biometric()
        .authenticate("Unlock your vault".to_string(), AuthOptions::default())
        .map_err(|e| e.to_string())
}

pub fn mac_unlock(reply: &block2::Block<dyn Fn(objc2::runtime::Bool, *mut objc2_foundation::NSError)>) {
    let ctx = unsafe { LAContext::new() };
    let reason = NSString::from_str("Unlock your vault");
    unsafe { ctx.evaluatePolicy_localizedReason_reply(LAPolicy::DeviceOwnerAuthenticationWithBiometrics, &reason, reply) };
}
