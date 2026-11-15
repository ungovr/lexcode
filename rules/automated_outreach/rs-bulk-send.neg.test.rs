// lexcode-expect: 0
use aws_sdk_sesv2::Client;

// One email to the one person who asked for it is not a bulk send.
pub async fn receipt(ses: Client, to: &str) -> anyhow::Result<()> {
    ses.send_email()
        .from_email_address("orders@example.org")
        .send()
        .await?;
    Ok(())
}

// A batch of database writes, and a channel batch, are not messages to people.
pub async fn flush(writer: BatchWriter, rows: Vec<Row>) -> anyhow::Result<()> {
    writer.write_batch(rows).await?;
    writer.batch.flush().await?;
    Ok(())
}
