// An attribute on a generic parameter (`impl<#[cfg(feature = "ts-rs")] T: ts_rs::TS, ...>`): the
// engine's Rust grammar cannot read the item that carries it, so the call in the impl is not
// matched; the items before and after it are read. When such an item has a where clause or ends
// the file, the whole file is lost (generic-param-attr-where.rs).
use reqwest;

pub fn before() {
    let _ = reqwest::get("https://a.example.com");
}

pub struct PagedResponse<T> {
    pub items: Vec<T>,
}

impl<#[cfg(feature = "ts-rs")] T: ts_rs::TS, #[cfg(not(feature = "ts-rs"))] T> PagedResponse<T> {
    pub fn fetch(&self) {
        let _ = reqwest::get("https://b.example.com");
    }
}

pub fn after() {
    let _ = reqwest::get("https://c.example.com");
}
