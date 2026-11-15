// lexcode-expect: 2
use opengraph as ogp;

// The posted link's page fetched with ureq, then read with opengraph's extract.
pub fn card(link: &str) -> anyhow::Result<ogp::Object> {
    let body = ureq::get(link).call()?.into_string()?;
    let agent = ureq::agent();
    let again = agent.get(link).call()?.into_string()?;
    Ok(ogp::extract(&mut body.as_bytes(), Default::default())?)
}
