// lexcode-expect: 9
package demo.sms;

import android.telephony.SmsManager;
import com.google.firebase.messaging.FirebaseMessaging;
import com.twilio.rest.api.v2010.account.Call;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import java.net.URI;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import software.amazon.awssdk.services.sns.SnsClient;
import software.amazon.awssdk.services.sns.model.PublishRequest;

// Texts, calls and pushes the code sends, where it does not show whether a person just asked.
public class Notifier {
    private final SnsClient sns;
    private final com.amazonaws.services.sns.AmazonSNS legacySns;
    private final SmsGateway smsGateway;
    private final FirebaseMessaging firebaseMessaging;

    public Notifier(SnsClient sns, com.amazonaws.services.sns.AmazonSNS legacySns, SmsGateway smsGateway,
                    FirebaseMessaging firebaseMessaging) {
        this.sns = sns;
        this.legacySns = legacySns;
        this.smsGateway = smsGateway;
        this.firebaseMessaging = firebaseMessaging;
    }

    public void orderShipped(String phone) {
        Message.creator(new PhoneNumber(phone), new PhoneNumber("+15550100"), "Your order shipped.").create();
    }

    public void callAboutBalance(String phone) {
        Call.creator(new PhoneNumber(phone), new PhoneNumber("+15550100"), URI.create("https://example.org/voice.xml")).create();
    }

    public void pushDeal(com.google.firebase.messaging.Message deal) throws Exception {
        firebaseMessaging.send(deal);
    }

    public int webPush(PushService pushService, Subscription sub, String json) throws Exception {
        return pushService.send(new Notification(sub, json)).getStatusLine().getStatusCode();
    }

    public void androidText(String phone, String text) {
        SmsManager.getDefault().sendTextMessage(phone, null, text, null, null);
    }

    public void viaSnsV2(String phone, String text) {
        sns.publish(PublishRequest.builder().phoneNumber(phone).message(text).build());
    }

    public void viaSnsV1(String phone, String text) {
        legacySns.publish(new com.amazonaws.services.sns.model.PublishRequest().withPhoneNumber(phone).withMessage(text));
    }

    public void viaGateway(String phone) {
        smsGateway.sendSms(phone, "Your table is ready.");
        smsGateway.sendSMS(phone, "Your table is ready.");
    }
}
