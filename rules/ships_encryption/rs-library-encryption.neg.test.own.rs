// lexcode-expect: 0
use std::marker::PhantomData;

// An app's own generic oaep_encrypt and its own Fernet are not the rsa crate's or the fernet crate's,
// in a file with no `use rsa::` or `use fernet` line.
pub struct Codec<T> {
    _t: PhantomData<T>,
}

impl<T> Codec<T> {
    pub fn oaep_encrypt<H>(&self, data: &[u8]) -> Vec<u8> {
        data.to_vec()
    }
}

mod tokens {
    pub struct Fernet;
    impl Fernet {
        pub fn new(_k: &str) -> Option<Self> {
            Some(Fernet)
        }
    }
}

pub fn run(c: &Codec<u8>) -> Vec<u8> {
    let _ = tokens::Fernet::new("k");
    c.oaep_encrypt::<u8>(b"x")
}
