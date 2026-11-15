// lexcode-expect: 0
use sentry::ClientOptions;

// Error reporting with no person in it, and a scope cleared at sign-out.
pub fn init_reporting(dsn: &str) -> sentry::ClientInitGuard {
    sentry::init((
        dsn,
        ClientOptions {
            release: sentry::release_name!(),
            send_default_pii: false,
            traces_sample_rate: 0.1,
            ..Default::default()
        },
    ))
}

pub fn sign_out() {
    sentry::configure_scope(|scope| {
        scope.set_user(None);
        scope.set_tag("signed_in", "false");
    });
}

// The app's own Customer, with no Stripe import.
pub struct Customer {
    pub label: String,
}

impl Customer {
    pub fn create(label: &str) -> Self {
        Customer { label: label.to_owned() }
    }
}

// The app's own session holder with a set_user method, outside any Sentry scope.
pub struct Session {
    user: Option<String>,
}

impl Session {
    pub fn set_user(&mut self, user: Option<String>) {
        self.user = user;
    }
}

pub fn start(session: &mut Session) -> Customer {
    session.set_user(Some("guest".to_owned()));
    Customer::create("walk-in")
}
