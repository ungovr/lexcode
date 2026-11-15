// lexcode-expect: 5
use sentry as sn;
use sentry::{configure_scope, ClientOptions, User};
use stripe::{Client, CreateCustomer, Customer, UpdateCustomer};

pub fn init_reporting(dsn: &str) -> sentry::ClientInitGuard {
    sentry::init((
        dsn,
        ClientOptions {
            release: sentry::release_name!(),
            send_default_pii: true,
            ..Default::default()
        },
    ))
}

pub fn identify(id: &str, email: &str) {
    configure_scope(|scope| {
        scope.set_user(Some(User {
            id: Some(id.to_owned()),
            email: Some(email.to_owned()),
            ..Default::default()
        }));
    });
}

pub fn identify_once(id: &str) {
    sn::with_scope(
        |scope| scope.set_user(Some(sn::User { id: Some(id.to_owned()), ..Default::default() })),
        || sn::capture_message("checkout failed", sn::Level::Error),
    );
}

pub async fn create_customer(client: &Client, email: &str, name: &str) -> Result<Customer, stripe::StripeError> {
    Customer::create(
        client,
        CreateCustomer {
            email: Some(email),
            name: Some(name),
            ..Default::default()
        },
    )
    .await
}

pub async fn change_email(client: &Client, id: &stripe::CustomerId, email: &str) -> Result<Customer, stripe::StripeError> {
    Customer::update(client, id, UpdateCustomer { email: Some(email), ..Default::default() }).await
}
