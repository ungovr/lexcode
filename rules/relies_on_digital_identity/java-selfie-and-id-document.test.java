// lexcode-expect: 3
// Document-and-selfie identity verification: an entity that holds a captured face image beside
// an image of the person's photo ID, an upload endpoint that takes both, and an OkHttp
// multipart request that sends both (one match for each shape).
package demo.verification;

import javax.persistence.Entity;
import javax.persistence.Lob;
import okhttp3.MultipartBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Entity
public class IdentityCheck {
  @Lob
  private byte[] selfieImage;

  @Lob
  private byte[] idDocumentFront;

  private String status;
}

class VerificationController {
  @PostMapping("/verify")
  public String verify(
      @RequestParam("selfie") MultipartFile selfie,
      @RequestParam("idDocument") MultipartFile idDocument) {
    return "received";
  }
}

class VerificationUpload {
  public MultipartBody body(byte[] face, byte[] passport) {
    MultipartBody.Builder builder = new MultipartBody.Builder().setType(MultipartBody.FORM);
    builder.addFormDataPart("selfie", "face.jpg", null);
    builder.addFormDataPart("passport_image", "passport.jpg", null);
    return builder.build();
  }
}
