// lexcode-expect: 0
package demo.sms

import android.app.NotificationManager
import android.telephony.SmsManager
import com.google.firebase.messaging.FirebaseMessaging

// This file imports neither Twilio nor the web push library, so a call that only has their class
// names (Call, Notification) is the app's own.
class Texts(
    private val smsService: SmsGateway,
    private val notifications: NotificationManager,
    private val sns: aws.sdk.kotlin.services.sns.SnsClient,
) {
    // A one-time code the person just asked for is a transactional text, not outreach.
    fun sendLoginCode(phone: String, code: String) {
        Message.creator(PhoneNumber(phone), PhoneNumber("+15550100"), "Your verification code is $code").create()
        smsService.sendSms(phone, "Your one-time passcode: $code")
        smsService.sendSMS(phone, "Your PIN is 1234")
    }

    fun sendLoginCodeAndroid(manager: SmsManager, phone: String, code: String) {
        manager.sendTextMessage(phone, null, "Your OTP is $code", null, null)
    }

    // The same, through Amazon SNS: the builder form and the Kotlin DSL form, in both property orders.
    suspend fun sendLoginCodeSns(phone: String, code: String) {
        sns.publish(PublishRequest.builder().phoneNumber(phone).message("Your password reset code is $code").build())
        sns.publish {
            phoneNumber = phone
            message = "Your verification code is $code"
        }
        sns.publish {
            message = "Your verification code is $code"
            phoneNumber = phone
        }
    }

    // Twilio Verify starts a verification the person requested; it is not a message campaign.
    fun startVerification(serviceSid: String, phone: String) {
        com.twilio.rest.verify.v2.service.Verification.creator(serviceSid, phone, "sms").create()
    }

    // Reading messages, subscribing a device to a topic and posting a local notification send nothing.
    fun housekeeping() {
        FirebaseMessaging.getInstance().subscribeToTopic("news")
        FirebaseMessaging.getInstance().getToken()
        notifications.cancelAll()
    }

    // An internal bus called "messaging" publishes to topics inside the app; no phone is involved.
    fun publish(messaging: InternalMessaging, topic: String, event: Any) {
        messaging.send(topic, event)
    }

    fun onIncoming(manager: SmsManager) {
        manager.subscriptionId
    }

    // Classes of the app's own that carry the names of vendor classes.
    fun lookalikes(registry: Registry, phone: String) {
        Call.creator(PhoneNumber(phone), PhoneNumber("+15550100"), "https://example.org/voice.xml").create()
        registry.send(Notification("title", "body"))
        registry.sendAsync(Notification("title", "body"))
    }
}
