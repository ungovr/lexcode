// lexcode-expect: 0
// Calls to other APIs, and a vendor named in a log line, a constant or a documentation link
// without anything being called. Stripe's payments API and an identity vendor's marketing site
// are not identity-verification calls.
package demo.http;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.logging.Logger;
import org.springframework.web.client.RestTemplate;

public class Calls {
  private static final Logger LOG = Logger.getLogger("calls");
  private static final String RETIRED = "https://api.onfido.com/v3.6/checks";

  public HttpResponse<String> own(String userId) throws Exception {
    HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.example.org/v1/users/" + userId)).build();
    return HttpClient.newHttpClient().send(request, HttpResponse.BodyHandlers.ofString());
  }

  public String charge(RestTemplate rest, String body) {
    return rest.postForObject("https://api.stripe.com/v1/payment_intents", body, String.class);
  }

  public void mention() {
    LOG.info("we no longer use https://api.sumsub.com/resources/applicants");
    LOG.info("docs: https://documentation.onfido.com/");
  }

  public String blog(RestTemplate rest) {
    return rest.getForObject("https://www.yoti.com/blog/", String.class);
  }
}
