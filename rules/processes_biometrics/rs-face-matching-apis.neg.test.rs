// lexcode-expect: 0
use crate::directory::Directory;

// A profile photo stored as uploaded, and faces found only to blur them: neither names anyone.
pub async fn blur_faces(vision: &crate::vision::Client, photo: Vec<u8>) -> anyhow::Result<usize> {
    let found = vision.detect_faces().image(photo.clone()).send().await?;
    let _labels = vision.detect_labels().image(photo).send().await?;
    Ok(found.len())
}

pub async fn detect_by_address(http: &reqwest::Client, endpoint: &str) -> anyhow::Result<()> {
    http.post(format!("{endpoint}/face/v1.0/detect?returnFaceId=false")).send().await?;
    http.post("https://api-us.faceplusplus.com/facepp/v3/detect").send().await?;
    Ok(())
}

// The app's own member directory, whose search builders share Rekognition's generic names, in a
// file that does not name that service.
pub fn find_members(dir: &Directory) {
    let _people = dir.search_users().name("ana").run();
    let _avatars = dir.search_faces().run();
    let _linked = dir.associate_faces().run();
}
