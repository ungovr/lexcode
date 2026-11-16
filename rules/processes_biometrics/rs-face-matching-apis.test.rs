// lexcode-expect: 10
use aws_sdk_rekognition::primitives::Blob;
use aws_sdk_rekognition::types::Image;
use aws_sdk_rekognition::Client;

pub async fn verify_selfie(rek: &Client, id_photo: Vec<u8>, selfie: Vec<u8>) -> anyhow::Result<bool> {
    let out = rek
        .compare_faces()
        .source_image(Image::builder().bytes(Blob::new(id_photo)).build())
        .target_image(Image::builder().bytes(Blob::new(selfie)).build())
        .similarity_threshold(90.0)
        .send()
        .await?;
    Ok(!out.face_matches().is_empty())
}

pub async fn enroll_and_find(rek: &Client, photo: Vec<u8>, face_id: &str) -> anyhow::Result<()> {
    let image = Image::builder().bytes(Blob::new(photo)).build();
    rek.index_faces().collection_id("members").image(image.clone()).send().await?;
    rek.search_faces_by_image().collection_id("members").image(image.clone()).send().await?;
    rek.search_faces().collection_id("members").face_id(face_id).send().await?;
    rek.search_users_by_image().collection_id("members").image(image).send().await?;
    rek.search_users().collection_id("members").face_id(face_id).send().await?;
    rek.associate_faces().collection_id("members").user_id("u-1").send().await?;
    rek.start_face_search().collection_id("members").send().await?;
    Ok(())
}

pub async fn azure_and_facepp(http: &reqwest::Client, endpoint: &str) -> anyhow::Result<()> {
    let url = format!("{endpoint}/face/v1.0/identify");
    http.post(url).send().await?;
    http.post("https://api-us.faceplusplus.com/facepp/v3/compare").send().await?;
    Ok(())
}
