// lexcode-expect: 0
use actix_web::{web, HttpResponse};
use lettre::{AsyncSmtpTransport, AsyncTransport, Message, Tokio1Executor};
use tokio::sync::mpsc::Sender;

// An app's own types with the short names of library items, in a file without those crates' use lines.
pub struct OutboundMessage {
    pub body: String,
}

impl OutboundMessage {
    pub fn new(body: &str) -> Self {
        Self { body: body.to_string() }
    }
}

pub struct WebPushMessageBuilder;

impl WebPushMessageBuilder {
    pub fn new(_s: &str) -> Self {
        Self
    }
}

// The mail a person asked for: one confirmation to the address they just typed.
pub async fn subscribe(
    form: web::Form<FormData>,
    mailer: web::Data<AsyncSmtpTransport<Tokio1Executor>>,
) -> HttpResponse {
    let email = Message::builder()
        .to(form.email.parse().unwrap())
        .subject("Confirm your subscription")
        .body(String::from("Click the link"))
        .unwrap();
    mailer.send(email).await.unwrap();
    send_confirmation_email(&form.email);
    HttpResponse::Ok().finish()
}

// One message, retried; and one message tried on each relay in turn.
pub async fn send_with_retry(mailer: &AsyncSmtpTransport<Tokio1Executor>, email: Message) {
    for attempt in 0..3 {
        if mailer.send(email.clone()).await.is_ok() {
            break;
        }
    }
    for relay in relays() {
        relay_mailer(relay).send(email.clone()).await.unwrap();
    }
}

// A chat server relaying what one person typed to the room: a person composed it.
pub async fn relay_to_room(sessions: Vec<Session>, text: String, outbox: Sender<String>) {
    for mut session in sessions {
        session.text(text.clone()).await.unwrap();
        outbox.send(text.clone()).await.unwrap();
    }
}

// One long bot reply split into pieces is one answer to one person.
pub async fn long_reply(bot: Bot, chat: ChatId, answer: String) {
    for chunk in answer.as_bytes().chunks(4096) {
        bot.send_message(chat, String::from_utf8_lossy(chunk)).await.unwrap();
    }
}

// The lookalike types built in a loop.
pub fn build_all(items: Vec<String>) -> Vec<OutboundMessage> {
    let mut out = vec![];
    for item in items {
        out.push(OutboundMessage::new(&item));
        let _b = WebPushMessageBuilder::new(&item);
    }
    out
}
