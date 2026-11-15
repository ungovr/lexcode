// lexcode-expect: 0
use lopdf::{Document, Object};

// Reading the signatures a PDF already holds, and comparing their SubFilter, signs nothing. An app's
// own sign_document in a file that does not use pdf_signing is not that crate's.
pub struct Report;
impl Report {
    pub fn sign_document(&self, author: &str) -> String {
        format!("approved by {author}")
    }
}

pub fn count_signatures(doc: &Document) -> usize {
    let mut n = 0;
    for (_, object) in doc.objects.iter() {
        if let Ok(dict) = object.as_dict() {
            let is_sig = dict.get(b"Type").ok().and_then(|t| t.as_name().ok()) == Some(b"Sig".as_slice());
            let sub = dict.get(b"SubFilter").ok().and_then(|s| s.as_name().ok());
            if is_sig && sub == Some(b"adbe.pkcs7.detached".as_slice()) {
                n += 1;
            }
        }
    }
    let _ = Report.sign_document("editor");
    let _ = Object::Null;
    n
}
