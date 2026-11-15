// lexcode-expect: 0
use rss::{ChannelBuilder, ItemBuilder};

// Publishing the app's own feed is not reading another publisher's.
pub fn own_feed(posts: &[(String, String)]) -> String {
    let items: Vec<_> = posts
        .iter()
        .map(|(title, link)| ItemBuilder::default().title(title.clone()).link(link.clone()).build())
        .collect();
    let channel = ChannelBuilder::default()
        .title("Example blog")
        .link("https://blog.example.com")
        .items(items)
        .build();
    channel.to_string()
}

// A feed read from the app's own files (a bundled sample, a fixture on disk) is not another
// publisher's content.
pub fn bundled() -> anyhow::Result<()> {
    let sample = rss::Channel::read_from(&include_bytes!("sample.xml")[..])?;
    let file = std::fs::File::open("feeds/sample.xml")?;
    let from_disk = rss::Channel::read_from(std::io::BufReader::new(file))?;
    let atom = feed_rs::parser::parse(std::fs::read("feeds/atom.xml")?.as_slice())?;
    let atom_path = std::path::Path::new("feeds/atom.xml");
    let parsed = feed_rs::parser::parse(std::fs::File::open(atom_path)?)?;
    let literal = "<rss version=\"2.0\"><channel></channel></rss>".parse::<rss::Channel>()?;
    Ok(())
}

