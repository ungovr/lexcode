// lexcode-expect: 0
use std::time::Duration;

use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};

// An app's own Job type, in a file without tokio-cron-scheduler.
pub struct Job;

impl Job {
    pub fn new_async(_spec: &str, f: impl Fn()) -> Self {
        f();
        Self
    }
}

// A timer that cleans up, with no send in it.
pub async fn cleanup(pool: PgPool) {
    let mut interval = tokio::time::interval(Duration::from_secs(60));
    loop {
        interval.tick().await;
        purge_expired_sessions(&pool).await;
    }
}

// A retry loop that backs off between attempts at one message is not a timer.
pub async fn send_once(mailer: &AsyncSmtpTransport<Tokio1Executor>, email: Message) {
    loop {
        match mailer.send(email.clone()).await {
            Ok(_) => break,
            Err(_) => tokio::time::sleep(Duration::from_secs(5)).await,
        }
    }
}

// The lookalike Job running a send.
pub fn lookalike() {
    let _job = Job::new_async("0 0 9 * * *", || {
        send_digest_email();
    });
}
