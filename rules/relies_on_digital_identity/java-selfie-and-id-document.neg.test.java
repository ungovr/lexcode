// lexcode-expect: 0
// Image fields and uploads that are not a selfie beside a photo ID: a profile with an avatar and
// a cover photo, a photo-sharing post with a selfie and a receipt, a record that holds only an
// identity document (a form with no face to match), and constants that merely contain the words.
package demo.profile;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

public class Profile {
  public static final String SELFIE_FOLDER = "selfies";
  public static final int ID_CARD_MAX_BYTES = 1000000;

  private byte[] avatarImage;
  private byte[] coverPhoto;
  private String displayName;
}

class Snap {
  private byte[] selfieImage;
  private byte[] receiptImage;
  private String caption;
}

class TaxForm {
  private byte[] passportScan;
  private String taxNumber;
}

class Uploads {
  @PostMapping("/avatar")
  public String avatar(@RequestParam("avatar") MultipartFile avatar, @RequestParam("cover") MultipartFile cover) {
    return "ok";
  }

  @PostMapping("/snap")
  public String snap(@RequestParam("selfie") MultipartFile selfie, @RequestParam("receipt") MultipartFile receipt) {
    return "ok";
  }
}
