// lexcode-expect: 0
package demo.sms;

import android.app.NotificationManager;
import android.telephony.SmsManager;
import com.google.firebase.messaging.FirebaseMessaging;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.rest.verify.v2.service.Verification;
import com.twilio.type.PhoneNumber;

public class Texts {
    private final SmsGateway smsService;
    private final NotificationManager notifications;

    public Texts(SmsGateway smsService, NotificationManager notifications) {
        this.smsService = smsService;
        this.notifications = notifications;
    }

    // A one-time code the person just asked for is a transactional text, not outreach.
    public void sendLoginCode(String phone, String code) {
        Message.creator(new PhoneNumber(phone), new PhoneNumber("+15550100"), "Your verification code is " + code).create();
        smsService.sendSms(phone, "Your one-time passcode: " + code);
    }

    // Twilio Verify starts a verification the person requested; it is not a message campaign.
    public void startVerification(String serviceSid, String phone) {
        Verification.creator(serviceSid, phone, "sms").create();
    }

    // Reading messages, subscribing a device to a topic and posting a local notification send nothing.
    public void housekeeping(String sid) {
        Message.reader().read();
        FirebaseMessaging.getInstance().subscribeToTopic("news");
        FirebaseMessaging.getInstance().getToken();
        notifications.cancelAll();
    }

    // An internal bus called "messaging" publishes to topics inside the app; no phone is involved.
    public void publish(InternalMessaging messaging, String topic, Object event) {
        messaging.send(topic, event);
    }

    public void onIncoming(SmsManager manager) {
        manager.getSubscriptionId();
    }
}
