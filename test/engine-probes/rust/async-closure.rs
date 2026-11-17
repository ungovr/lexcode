// An async closure (Rust 2024): the engine's Rust grammar drops the `async` keyword and reads the
// closure as a plain one, so the call in its body and the calls around it are still matched.
use reqwest;

pub async fn register(conn: Conn) -> Result<(), Error> {
    let user = conn
        .transaction(async |conn| {
            let page = reqwest::get("https://a.example.com").await;
            page
        })
        .await?;
    let later = async move || reqwest::get("https://b.example.com").await;
    let _ = reqwest::get("https://c.example.com").await;
    Ok(())
}
