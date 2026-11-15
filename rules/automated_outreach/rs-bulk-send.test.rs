// lexcode-expect: 3
use aws_sdk_sesv2::{types::BulkEmailEntry, Client};
use resend_rs::Resend;

pub async fn announce(ses: Client, ses_v1: aws_sdk_ses::Client, entries: Vec<BulkEmailEntry>) -> anyhow::Result<()> {
    ses.send_bulk_email()
        .from_email_address("news@example.org")
        .set_bulk_email_entries(Some(entries))
        .send()
        .await?;
    ses_v1
        .send_bulk_templated_email()
        .source("news@example.org")
        .template("weekly")
        .send()
        .await?;
    Ok(())
}

pub async fn batch(resend: Resend, emails: Vec<resend_rs::types::CreateEmailBaseOptions>) -> anyhow::Result<()> {
    resend.batch.send(emails).await?;
    Ok(())
}
