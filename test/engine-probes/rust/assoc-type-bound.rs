// An associated-type bound inside a generic argument list (`CursorKey<C, SqlType: Send>`, Rust
// 1.79): the engine's Rust grammar drops the `: Send` and reads the rest of the file.
use reqwest;

pub trait CursorKey<C> {
    type SqlType;
}

pub fn keyed<A, B>(a: A, b: B)
where
    B: CursorKey<u32, SqlType: Send>,
{
    let _ = reqwest::get("https://a.example.com");
}

pub fn after() {
    let _ = reqwest::get("https://b.example.com");
}
