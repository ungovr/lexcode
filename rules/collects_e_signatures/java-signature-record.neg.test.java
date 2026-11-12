// lexcode-expect: 0
// A signature that is not a person signing an agreement: a webhook's HMAC signature, a release
// artifact's checksum signature, an email signature block on a user profile, a JWT's signature
// part, and an agreement entity whose fields are not a signature (its status and its text).
package demo.records;

import javax.persistence.Entity;

class WebhookEvent {
  private String signature;
  private String payload;
}

class ReleaseArtifact {
  private byte[] signature;
  private String version;
}

class UserProfile {
  private String emailSignature;
  private String displayName;
}

class JwtParts {
  private String header;
  private String payload;
  private String signature;
}

@Entity
class ServiceAgreement {
  private String status;
  private String termsText;
  private java.time.Instant effectiveOn;
}
