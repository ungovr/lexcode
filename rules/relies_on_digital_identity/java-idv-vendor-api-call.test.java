// lexcode-expect: 5
// Calling an identity-verification vendor's API directly: the JDK HttpClient, Spring's
// RestTemplate and WebClient, OkHttp and Apache HttpClient.
package demo.http;

import java.net.URI;
import java.net.http.HttpRequest;
import okhttp3.Request;
import org.apache.http.client.methods.HttpPost;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.reactive.function.client.WebClient;

public class VendorCalls {
  public HttpRequest sumsubApplicant(String body) {
    return HttpRequest.newBuilder(URI.create("https://api.sumsub.com/resources/applicants?levelName=basic-kyc-level"))
        .POST(HttpRequest.BodyPublishers.ofString(body))
        .build();
  }

  public String onfidoCheck(RestTemplate rest, String body) {
    return rest.postForObject("https://api.eu.onfido.com/v3.6/checks", body, String.class);
  }

  public WebClient personaClient() {
    return WebClient.create("https://withpersona.com/api/v1");
  }

  public Request jumioAccount(String token) {
    return new Request.Builder().url("https://account.amer-1.jumio.ai/api/v1/accounts").header("Authorization", token).build();
  }

  public HttpPost yoti(String payload) {
    return new HttpPost("https://api.yoti.com/ai/v1/age");
  }
}
