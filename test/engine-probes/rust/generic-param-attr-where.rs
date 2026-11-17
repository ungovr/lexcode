// An attribute on a generic parameter of an item with a where clause: the engine fails on the
// whole file ("Other syntax error ... Common.Impossible"), and no call in it is matched, before or
// after the item. The same happens when the item is the last in the file.
use std::fmt;

pub fn before() {
    let _ = reqwest::get("https://a.example.com");
}

fn paginate<
    #[cfg(feature = "ts-rs")] T: ts_rs::TS,
    #[cfg(not(feature = "ts-rs"))] T,
>(data: Vec<T>) -> Vec<T>
where
    T: Clone,
{
    let _ = reqwest::get("https://b.example.com");
    data
}

pub fn after() {
    let _ = reqwest::get("https://c.example.com");
}
