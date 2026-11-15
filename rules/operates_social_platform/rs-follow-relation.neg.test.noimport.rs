// lexcode-expect: 0
use std::collections::HashMap;

// The app's own insert_into, in a file that does not use Diesel: a key-value cache of table
// rows, not a database write.
mod cache {
    pub fn insert_into(table: &'static str) -> usize {
        table.len()
    }
}

pub mod follows {
    pub const table: &str = "follows";
}

pub fn warm(map: &mut HashMap<&'static str, usize>) {
    use cache::insert_into;
    map.insert("follows", insert_into(follows::table));
}
