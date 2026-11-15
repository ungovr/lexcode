// lexcode-expect: 0
use std::collections::HashMap;

// The app's own Form type, in a file that uses no web framework: a tax form a desktop
// accountant's command registers in its ledger.
pub struct Form<T> {
    pub fields: HashMap<String, T>,
}

pub fn register(form: Form<String>) -> usize {
    form.fields.len()
}

pub async fn subscribe(form: Form<u32>) -> usize {
    form.fields.len()
}
