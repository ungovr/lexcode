// lexcode-expect: 6
// Velopack (its documented glob import), cargo-dist's axoupdater, and self_replace swapping the
// running executable for a downloaded release, each also through an alias or a grouped `use`.
use axoupdater as axo;
use axoupdater::AxoUpdater;
use self_replace::{self_replace as replace_exe};
use velopack::*;

fn main() {
    VelopackApp::build().run();
}

pub fn update_with_velopack() -> Result<(), velopack::Error> {
    let source = sources::HttpSource::new("https://downloads.example.com/releases");
    let um = UpdateManager::new(source, None, None)?;
    if let UpdateCheck::UpdateAvailable(updates) = um.check_for_updates()? {
        um.download_updates(&updates, None)?;
        um.apply_updates_and_restart(&updates)?;
    }
    Ok(())
}

pub fn update_with_axo() -> Result<(), Box<dyn std::error::Error>> {
    let mut updater = AxoUpdater::new_for("tool");
    updater.load_receipt()?;
    updater.run_sync()?;
    Ok(())
}

pub fn swap(new_exe: &std::path::Path) -> std::io::Result<()> {
    self_replace::self_replace(new_exe)
}

pub fn update_installed_copy(staged: &std::path::Path) -> Result<(), Box<dyn std::error::Error>> {
    let mut updater = axo::AxoUpdater::new_for_updater_executable()?;
    updater.load_receipt()?;
    replace_exe(staged)?;
    Ok(())
}
