// lexcode-expect: 11
package demo.sms

import android.telephony.SmsManager
import com.google.firebase.messaging.FirebaseMessaging
import com.twilio.rest.api.v2010.account.Call
import com.twilio.rest.api.v2010.account.Message
import com.twilio.type.PhoneNumber
import java.net.URI
import nl.martijndwars.webpush.Notification
import nl.martijndwars.webpush.PushService
import nl.martijndwars.webpush.Subscription
import software.amazon.awssdk.services.sns.SnsClient
import software.amazon.awssdk.services.sns.model.PublishRequest

// Texts, calls and pushes the code sends, where it does not show whether a person just asked.
class Notifier(
    private val sns: SnsClient,
    private val snsKotlin: aws.sdk.kotlin.services.sns.SnsClient,
    private val legacySns: com.amazonaws.services.sns.AmazonSNS,
    private val smsGateway: SmsGateway,
    private val firebaseMessaging: FirebaseMessaging,
) {
    fun orderShipped(phone: String) {
        Message.creator(PhoneNumber(phone), PhoneNumber("+15550100"), "Your order shipped.").create()
    }

    fun callAboutBalance(phone: String) {
        Call.creator(PhoneNumber(phone), PhoneNumber("+15550100"), URI.create("https://example.org/voice.xml")).create()
    }

    fun pushDeal(deal: com.google.firebase.messaging.Message) {
        firebaseMessaging.send(deal)
    }

    fun webPush(pushService: PushService, sub: Subscription, json: String): Int =
        pushService.send(Notification(sub, json)).statusLine.statusCode

    fun androidText(phone: String, text: String) {
        SmsManager.getDefault().sendTextMessage(phone, null, text, null, null)
    }

    fun viaSnsV2(phone: String, text: String) {
        sns.publish(PublishRequest.builder().phoneNumber(phone).message(text).build())
    }

    suspend fun viaSnsKotlin(phone: String, text: String) {
        snsKotlin.publish {
            phoneNumber = phone
            message = text
        }
        snsKotlin.publish {
            message = text
            phoneNumber = phone
        }
    }

    fun viaSnsV1(phone: String, text: String) {
        legacySns.publish(com.amazonaws.services.sns.model.PublishRequest().withPhoneNumber(phone).withMessage(text))
    }

    fun viaGateway(phone: String) {
        smsGateway.sendSms(phone, "Your table is ready.")
        smsGateway.sendSMS(phone, "Your table is ready.")
    }
}
