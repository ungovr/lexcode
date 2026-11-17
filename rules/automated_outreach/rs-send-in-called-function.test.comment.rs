// lexcode-expect: 1
use std::time::Duration;

use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};

// A polling worker whose comment and log string name return and break: neither is a way out of
// the loop, so it still polls.
pub async fn worker(pool: PgPool, mailer: AsyncSmtpTransport<Tokio1Executor>) {
    loop {
        // never return from here; break only on shutdown /* or } */
        mail_next(&pool, &mailer).await;
        tracing::debug!("no break; will return to the queue");
        tokio::time::sleep(Duration::from_secs(10)).await;
    }
}

async fn mail_next(pool: &PgPool, mailer: &AsyncSmtpTransport<Tokio1Executor>) {
    mailer.send(next_issue(pool).await).await.ok();
}
