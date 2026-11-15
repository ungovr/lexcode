// lexcode-expect: 3
// self_update: a released command-line program that replaces itself with the latest release,
// by path, through a nested `use` group (the crate's documented form) and through an alias.
use self_update as su;
use self_update::{backends::github::Update, cargo_crate_version};

pub fn update() -> Result<(), Box<dyn std::error::Error>> {
    let status = Update::configure()
        .repo_owner("example")
        .repo_name("tool")
        .bin_name("tool")
        .current_version(cargo_crate_version!())
        .build()?
        .update()?;
    println!("now at {}", status.version());
    Ok(())
}

pub fn update_from_gitlab() -> Result<(), Box<dyn std::error::Error>> {
    su::backends::gitlab::Update::configure().repo_owner("example").repo_name("tool").build()?.update()?;
    self_update::backends::s3::Update::configure().bucket_name("releases").build()?.update()?;
    Ok(())
}
