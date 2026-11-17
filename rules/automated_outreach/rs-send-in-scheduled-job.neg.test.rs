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

// I2: a timer whose job failed mails the operator about the error; that is an alert, not outreach.
pub async fn nightly(state: AppState, admin: String) {
    let mut interval = tokio::time::interval(Duration::from_secs(86400));
    loop {
        interval.tick().await;
        if let Err(e) = run_job(&state).await {
            send_alert_email(&admin, &e.to_string());
            state.mailer.send(alert_message(&admin, &e)).await.unwrap();
        }
    }
}

// The same alert from a `match` arm on the job's failure: two arms in either order, and three.
pub async fn nightly_match(state: AppState, admin: String) {
    let mut interval = tokio::time::interval(Duration::from_secs(86400));
    loop {
        interval.tick().await;
        match run_job(&state).await {
            Ok(n) => tracing::info!("ran {n}"),
            Err(e) => send_alert_email(&admin, &e.to_string()),
        }
        match run_job(&state).await {
            Err(e) => {
                send_alert_email(&admin, &e.to_string());
            }
            Ok(_) => {}
        }
        match run_job(&state).await {
            Ok(Some(_)) => {}
            Ok(None) => {}
            Err(_) => state.mailer.send(alert_message(&admin)).await.unwrap(),
        }
    }
}

// The alert arm among any number of arms, in any position, and alone.
pub async fn nightly_arms(state: AppState, admin: String) {
    let mut interval = tokio::time::interval(Duration::from_secs(86400));
    loop {
        interval.tick().await;
        match run_job(&state).await {
            Ok(Some(_)) => {}
            Err(_) => send_alert_email(&admin, "middle of three"),
            Ok(None) => {}
        }
        match run_job(&state).await {
            Err(_) => send_alert_email(&admin, "first of three"),
            Ok(Some(_)) => {}
            Ok(None) => {}
        }
        match run_job(&state).await {
            Ok(Some(0)) => {}
            Ok(Some(_)) => {}
            Ok(None) => {}
            Err(_) => send_alert_email(&admin, "last of four"),
        }
        match run_job(&state).await {
            Ok(Some(0)) => {}
            Err(_) => send_alert_email(&admin, "second of four"),
            Ok(Some(_)) => {}
            Ok(None) => {}
        }
        match run_job(&state).await {
            Err(_) => send_alert_email(&admin, "first of four"),
            Ok(Some(0)) => {}
            Ok(Some(_)) => {}
            Ok(None) => {}
        }
        match run_job(&state).await {
            Ok(Some(0)) => {}
            Ok(Some(1)) => {}
            Err(_) => {
                send_alert_email(&admin, "third of five");
            }
            Ok(Some(_)) => {}
            Ok(None) => {}
        }
        match run_job(&state).await {
            Err(_) => send_alert_email(&admin, "alone"),
        }
    }
}

// The lookalike Job running a send.
pub fn lookalike() {
    let _job = Job::new_async("0 0 9 * * *", || {
        send_digest_email();
    });
}
