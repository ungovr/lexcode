// lexcode-expect: 4
use lopdf::{dictionary, Document, Object, ObjectId};
use pdf_signing::{PDFSigningDocument, UserSignatureInfo};

pub fn sign_contract(pdf: &[u8], signers: Vec<UserSignatureInfo>) -> anyhow::Result<Vec<u8>> {
    let mut doc = PDFSigningDocument::read_from(pdf, "contract.pdf".to_owned())?;
    let signed = doc.sign_document(signers)?;
    Ok(signed)
}

pub fn add_signature_field(doc: &mut Document, page: ObjectId) -> ObjectId {
    let sig = dictionary! {
        "Type" => "Sig",
        "Filter" => "Adobe.PPKLite",
        "SubFilter" => "adbe.pkcs7.detached",
        "Contents" => Object::string_literal(vec![0u8; 8192]),
    };
    let id = doc.add_object(sig);
    let mut v = lopdf::Dictionary::new();
    v.set("Type", Object::Name(b"Sig".to_vec()));
    v.set("SubFilter", Object::Name(b"ETSI.CAdES.detached".to_vec()));
    let mut legacy = lopdf::Dictionary::new();
    legacy.set(
        "SubFilter",
        Object::Name(b"adbe.pkcs7.sha1".to_vec()),
    );
    let _ = (page, v, legacy);
    id
}
