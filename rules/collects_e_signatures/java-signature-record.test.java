// lexcode-expect: 4
// A signature a person drew or captured, stored on the record of an agreement, waiver or
// consent: a waiver with a signature image, a lease with the tenant's signature, a consent form
// whose field is a base64 signature, and a nested class inside a consent controller.
package demo.records;

import javax.persistence.Entity;
import javax.persistence.Lob;

@Entity
public class EventWaiver {
  private String participantName;

  @Lob
  private byte[] signatureImage;
}

@Entity
class LeaseAgreement {
  private String unit;
  private byte[] tenantSignature;
}

class PhotoReleaseForm {
  private String signature;
  private java.time.Instant signedAt;
}

public class ConsentController {
  public static class ConsentRequest {
    public String guardianSignature;
    public String childName;
  }
}
