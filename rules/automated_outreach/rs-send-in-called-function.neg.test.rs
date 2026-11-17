// lexcode-expect: 0
use std::time::Duration;

use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use tokio::sync::mpsc::Receiver;

// One message retried until it goes through: the loop breaks or returns on success.
pub async fn deliver_with_retry(mailer: &AsyncSmtpTransport<Tokio1Executor>, email: Message) {
    loop {
        if try_deliver(mailer, email.clone()).await.is_ok() {
            break;
        }
        tokio::time::sleep(Duration::from_secs(5)).await;
    }
}

pub async fn deliver_or_give_up(mailer: &AsyncSmtpTransport<Tokio1Executor>, email: Message) -> anyhow::Result<()> {
    loop {
        match try_deliver(mailer, email.clone()).await {
            Ok(_) => return Ok(()),
            Err(_) => tokio::time::sleep(Duration::from_secs(5)).await,
        }
    }
}

async fn try_deliver(mailer: &AsyncSmtpTransport<Tokio1Executor>, email: Message) -> anyhow::Result<()> {
    mailer.send(email).await?;
    Ok(())
}

// An event loop answering each sign-up as it arrives: the confirmation a person asked for.
pub async fn on_signups(mut rx: Receiver<Signup>, mailer: AsyncSmtpTransport<Tokio1Executor>) {
    loop {
        let signup = rx.recv().await.unwrap();
        confirm(&mailer, &signup).await;
    }
}

async fn confirm(mailer: &AsyncSmtpTransport<Tokio1Executor>, signup: &Signup) {
    mailer.send(confirmation_for(signup)).await.ok();
}

// Retries by count, relays in turn, and the site's own administrators.
pub async fn fan_out(mailer: AsyncSmtpTransport<Tokio1Executor>, email: Message, admins: Vec<String>) {
    for attempt in 0..3 {
        if attempt_delivery(&mailer, email.clone()).await {
            return;
        }
    }
    for relay in relays() {
        via_relay(relay, email.clone()).await;
    }
    for admin in admins {
        tell_staff(&mailer, &admin).await;
    }
}

async fn attempt_delivery(mailer: &AsyncSmtpTransport<Tokio1Executor>, email: Message) -> bool {
    mailer.send(email).await.is_ok()
}

async fn via_relay(relay: Relay, email: Message) {
    let relay_mailer = relay.transport();
    relay_mailer.send(email).await.ok();
}

async fn tell_staff(mailer: &AsyncSmtpTransport<Tokio1Executor>, admin: &str) {
    mailer.send(staff_note(admin)).await.ok();
}

// A request handler's one send, called from no loop; and a loop whose callee sends nothing.
pub async fn subscribe(form: Form, mailer: AsyncSmtpTransport<Tokio1Executor>) -> HttpResponse {
    mailer.send(confirmation_to(&form.email)).await.ok();
    HttpResponse::Ok().finish()
}

pub async fn reindex(posts: Vec<Post>) {
    for post in posts {
        index_one(&post).await;
    }
}

async fn index_one(post: &Post) {
    search_client().index(post).await.ok();
}
