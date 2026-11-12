// lexcode-expect: 7
package demo.bulk;

import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.amazonaws.services.simpleemail.model.SendBulkTemplatedEmailRequest;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.MulticastMessage;
import com.resend.Resend;
import com.twilio.rest.notify.v1.service.Notification;
import software.amazon.awssdk.services.pinpoint.PinpointClient;
import software.amazon.awssdk.services.sesv2.SesV2Client;

// One call that reaches many recipients: a bulk email, a push multicast, a campaign send.
public class CampaignSender {
    private final AmazonSimpleEmailService ses;
    private final SesV2Client sesV2;
    private final FirebaseMessaging firebaseMessaging;
    private final PinpointClient pinpoint;
    private final Resend resend;

    public CampaignSender(AmazonSimpleEmailService ses, SesV2Client sesV2, FirebaseMessaging firebaseMessaging,
                          PinpointClient pinpoint, Resend resend) {
        this.ses = ses;
        this.sesV2 = sesV2;
        this.firebaseMessaging = firebaseMessaging;
        this.pinpoint = pinpoint;
        this.resend = resend;
    }

    public void newsletter(SendBulkTemplatedEmailRequest request) {
        ses.sendBulkTemplatedEmail(request);
    }

    public void newsletterV2(software.amazon.awssdk.services.sesv2.model.SendBulkEmailRequest request) {
        sesV2.sendBulkEmail(request);
    }

    public void pushToDevices(MulticastMessage message) throws Exception {
        firebaseMessaging.sendEachForMulticast(message);
    }

    public void pushToTopic(com.google.firebase.messaging.Message message) throws Exception {
        firebaseMessaging.sendAll(java.util.List.of(message));
    }

    public void campaign(software.amazon.awssdk.services.pinpoint.model.SendMessagesRequest request) {
        pinpoint.sendMessages(request);
    }

    public void batch(java.util.List<com.resend.services.emails.model.CreateEmailOptions> emails) throws Exception {
        resend.batch().send(emails);
    }

    public void notifyBindings(String serviceSid) {
        Notification.creator(serviceSid).setBody("Maintenance tonight").create();
    }
}
