// lexcode-expect: 0
// The app's own `Channel` (a chat room), `Feed` (a social wall) and `parser` module, in a file
// that imports none of rss, atom_syndication, syndication or feed-rs: reading a room from bytes
// and parsing a room or wall name are not reading a feed.
use crate::chat::Channel;
use crate::markup::parser;
use crate::social::Feed;

pub fn join(name: &str, body: &[u8]) -> Option<Channel> {
    let room = Channel::read_from(body).ok()?;
    let doc = parser::parse(body);
    let wall = name.parse::<Feed>().ok();
    name.parse::<Channel>().ok()
}
