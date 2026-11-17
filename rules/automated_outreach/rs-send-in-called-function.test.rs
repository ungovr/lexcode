// lexcode-expect: 7
use std::time::Duration;

use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use sqlx::PgPool;

pub struct Subscriber {
    pub email: String,
}

// A delivery worker that polls a queue: each pass takes one recipient off it and mails the issue,
// sleeping only when the queue is empty. The caller is written first.
async fn worker_loop(pool: PgPool, email_client: EmailClient) -> Result<(), anyhow::Error> {
    loop {
        match try_execute_task(&pool, &email_client).await {
            Ok(ExecutionOutcome::EmptyQueue) => {
                tokio::time::sleep(Duration::from_secs(10)).await;
            }
            Err(_) => {
                tokio::time::sleep(Duration::from_secs(1)).await;
            }
            Ok(ExecutionOutcome::TaskCompleted) => {}
        }
    }
}

pub async fn try_execute_task(
    pool: &PgPool,
    email_client: &EmailClient,
) -> Result<ExecutionOutcome, anyhow::Error> {
    let (issue, email) = dequeue_task(pool).await?;
    if let Err(e) = email_client
        .send_email(&email, &issue.title, &issue.html_content, &issue.text_content)
        .await
    {
        tracing::error!(error.message = %e, "Failed to deliver issue");
    }
    Ok(ExecutionOutcome::TaskCompleted)
}

// The sender is written before the loop that calls it once per subscriber.
async fn notify(mailer: &AsyncSmtpTransport<Tokio1Executor>, to: &Subscriber) -> anyhow::Result<()> {
    let email = Message::builder()
        .to(to.email.parse()?)
        .subject("New post")
        .body(String::from("A new post is up"))?;
    mailer.send(email).await?;
    Ok(())
}

pub async fn announce(mailer: AsyncSmtpTransport<Tokio1Executor>, subscribers: Vec<Subscriber>) {
    for subscriber in &subscribers {
        notify(&mailer, subscriber).await.ok();
    }
    subscribers.iter().for_each(|s| {
        remind(s);
    });
}

fn remind(s: &Subscriber) {
    send_reminder(&s.email);
}

pub async fn text_everyone(phones: impl Stream<Item = String>) {
    phones
        .for_each_concurrent(8, |phone| async move {
            text_one(&phone).await;
        })
        .await;
}

async fn text_one(phone: &str) {
    send_sms(phone, "Polls close at 8pm").await.ok();
}

// A row stream drained one row at a time.
pub async fn drain(mut rows: Rows, ses: SesClient) {
    while let Some(row) = rows.next().await {
        deliver_row(&ses, row).await;
    }
}

async fn deliver_row(ses: &SesClient, row: Row) {
    ses.send_email().from_email_address("news@example.org").send().await.ok();
}

// Methods of one impl: a ticking loop calls the sender through self and through Self.
impl DigestWorker {
    pub async fn run(&self) {
        let mut interval = tokio::time::interval(Duration::from_secs(3600));
        loop {
            interval.tick().await;
            self.deliver_digests().await;
            Self::deliver_alerts(&self.client).await;
        }
    }

    async fn deliver_digests(&self) {
        self.mailer.send(digest_message()).await.ok();
    }

    async fn deliver_alerts(client: &reqwest::Client) {
        client.post("https://api.resend.com/emails").json(&alert()).send().await.ok();
    }
}

// A function named for a send, called in a loop, is rs-send-in-loop's match at the call; the
// send inside it is not matched again.
pub async fn weekly(mailer: AsyncSmtpTransport<Tokio1Executor>, subscribers: Vec<Subscriber>) {
    for subscriber in subscribers {
        send_weekly_newsletter(&mailer, &subscriber).await;
    }
}

async fn send_weekly_newsletter(mailer: &AsyncSmtpTransport<Tokio1Executor>, to: &Subscriber) {
    mailer.send(newsletter_for(to)).await.ok();
}
