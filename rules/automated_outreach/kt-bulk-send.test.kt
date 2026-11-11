// lexcode-expect: 8
package demo.bulk

import com.amazonaws.services.simpleemail.AmazonSimpleEmailService
import com.amazonaws.services.simpleemail.model.SendBulkTemplatedEmailRequest
import com.google.firebase.messaging.FirebaseMessaging
import com.google.firebase.messaging.MulticastMessage
import com.resend.Resend
import com.twilio.rest.notify.v1.service.Notification
import software.amazon.awssdk.services.pinpoint.PinpointClient
import software.amazon.awssdk.services.sesv2.SesV2Client

// One call that reaches many recipients: a bulk email, a push multicast, a campaign send.
class CampaignSender(
    private val ses: AmazonSimpleEmailService,
    private val sesV2: SesV2Client,
    private val sesKotlin: aws.sdk.kotlin.services.sesv2.SesV2Client,
    private val firebaseMessaging: FirebaseMessaging,
    private val pinpoint: PinpointClient,
    private val resend: Resend,
) {
    fun newsletter(request: SendBulkTemplatedEmailRequest) {
        ses.sendBulkTemplatedEmail(request)
    }

    fun newsletterV2(request: software.amazon.awssdk.services.sesv2.model.SendBulkEmailRequest) {
        sesV2.sendBulkEmail(request)
    }

    suspend fun newsletterDsl() {
        sesKotlin.sendBulkEmail {
            defaultContent { }
        }
    }

    fun pushToDevices(message: MulticastMessage) {
        firebaseMessaging.sendEachForMulticast(message)
    }

    fun pushToTopic(message: com.google.firebase.messaging.Message) {
        firebaseMessaging.sendAll(listOf(message))
    }

    fun campaign(request: software.amazon.awssdk.services.pinpoint.model.SendMessagesRequest) {
        pinpoint.sendMessages(request)
    }

    fun batch(emails: List<com.resend.services.emails.model.CreateEmailOptions>) {
        resend.batch().send(emails)
    }

    fun notifyBindings(serviceSid: String) {
        Notification.creator(serviceSid).setBody("Maintenance tonight").create()
    }
}
