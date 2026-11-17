// lexcode-expect: 1
use std::time::Duration;

use lettre::{AsyncSmtpTransport, AsyncTransport, Tokio1Executor};

// A polling worker whose strings and char literals hold unbalanced braces: they do not end the
// loop's body.
pub async fn worker(pool: PgPool, mailer: AsyncSmtpTransport<Tokio1Executor>) {
    loop {
        let open = '{';
        let close = '\u{7d}';
        tracing::debug!("pass }}{{ {} {}", open, close);
        let s = "}{";
        let raw = r#"}"#;
        mail_next(&pool, &mailer, s, raw).await;
        tokio::time::sleep(Duration::from_secs(10)).await;
    }
}

async fn mail_next(pool: &PgPool, mailer: &AsyncSmtpTransport<Tokio1Executor>, a: &str, b: &str) {
    mailer.send(next_issue(pool, a, b).await).await.ok();
}
