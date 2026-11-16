// lexcode-expect: 0
use std::collections::HashMap;

// A call the app only carries from one person to another, with recording off, and an SMS.
pub async fn connect(http: &reqwest::Client, account: &str, from: &str, to: &str) -> anyhow::Result<()> {
    let url = format!("https://api.twilio.com/2010-04-01/Accounts/{account}/Calls.json");
    let params = [("From", from), ("To", to), ("Url", "https://example.org/voice/bridge"), ("Record", "false")];
    http.post(url).form(&params).send().await?;
    let sms = format!("https://api.twilio.com/2010-04-01/Accounts/{account}/Messages.json");
    http.post(sms).form(&[("Body", "Your table is ready")]).send().await?;
    Ok(())
}

// The app's own record-keeping, unrelated to calls.
pub fn audit_flags() -> HashMap<&'static str, &'static str> {
    let mut m = HashMap::new();
    m.insert("Record", "yes");
    m.insert("Archive", "true");
    m
}
