// lexcode-expect: 4
use std::collections::HashMap;

pub struct Twilio {
    http: reqwest::Client,
    account: String,
}

impl Twilio {
    pub async fn place_recorded_call(&self, from: &str, to: &str) -> anyhow::Result<()> {
        let url = format!("https://api.twilio.com/2010-04-01/Accounts/{}/Calls.json", self.account);
        let params = [
            ("From", from),
            ("To", to),
            ("Url", "https://example.org/voice/bridge"),
            ("Record", "true"),
        ];
        self.http.post(url).form(&params).send().await?;
        Ok(())
    }

    pub async fn record_live_call(&self, call_sid: &str) -> anyhow::Result<()> {
        let url = format!(
            "https://api.twilio.com/2010-04-01/Accounts/{}/Calls/{}/Recordings.json",
            self.account, call_sid
        );
        self.http.post(url).form(&[("RecordingChannels", "dual")]).send().await?;
        Ok(())
    }

    pub async fn open_room(&self, name: &str) -> anyhow::Result<()> {
        let mut form = HashMap::new();
        form.insert("UniqueName", name);
        form.insert("RecordParticipantsOnConnect", "true");
        self.http.post("https://video.twilio.com/v1/Rooms").form(&form).send().await?;
        Ok(())
    }

    pub async fn fetch_call_recordings(&self, call_sid: &str) -> anyhow::Result<String> {
        let url = format!("https://api.twilio.com/2010-04-01/Accounts/{}/Calls/{call_sid}/Recordings.json", self.account);
        Ok(self.http.get(url).send().await?.text().await?)
    }
}
