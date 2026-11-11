// lexcode-expect: 0
package demo.support

import android.app.Application
import android.content.Context
import com.google.firebase.analytics.FirebaseAnalytics
import io.sentry.Sentry
import zendesk.support.guide.HelpCenterActivity

// Support surfaces that are not a chat: a help-center article viewer, analytics and crash reporting
// initialized by name like the chat SDKs, a static contact form. This file imports none of the chat
// vendors' packages, so a call that only has a vendor's class name is the app's own.
class SupportApp : Application() {
    private lateinit var contactForm: ContactForm

    override fun onCreate() {
        super.onCreate()
        Sentry.init { options -> options.dsn = "https://example@sentry.invalid/1" }
        FirebaseAnalytics.getInstance(this)
        Analytics.init(this, "key")
        Billing.initialize(this)
    }

    // Articles only: the visitor reads, and nothing they type reaches a person or a bot.
    fun showHelp(context: Context) {
        HelpCenterActivity.builder().show(context)
    }

    // A form the app only saves.
    fun submitContact(email: String, body: String) {
        contactForm.save(email, body)
    }

    // A conversations client of the app's own, not a vendor's.
    fun conversations() = ConversationRepository.create("local")
}

// The app's own helper objects that happen to carry a vendor's name and method names.
object Intercom {
    fun initialize(app: Application, key: String, id: String) {
    }

    fun client(): Intercom = this
}

object Freshchat {
    fun getInstance(context: Context): Freshchat = this
}

class Chat private constructor() {
    fun init(context: Context, key: String) {
    }

    companion object {
        val INSTANCE = Chat()
    }
}

object Smooch {
    fun init(app: Application, a: Any?, b: Any?) {
    }
}

object SendbirdChat {
    fun init(a: Any?, b: Any?) {
    }
}

object SendbirdUIKit {
    fun init(a: Any?, b: Any?) {
    }
}

object SendBird {
    fun init(a: Any?, b: Any?) {
    }
}

class ChatClient {
    class Builder(private val key: String, private val context: Context) {
        fun build() = ChatClient()
    }
}

object ConversationsClient {
    fun create(context: Context, token: String, a: Any?, b: Any?) {
    }
}

class OwnApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Intercom.initialize(this, "android_sdk-key", "app-id")
        Intercom.client()
        Freshchat.getInstance(this)
        Chat.INSTANCE.init(this, "account-key")
        Smooch.init(this, null, null)
        SendbirdChat.init(null, null)
        SendbirdUIKit.init(null, null)
        SendBird.init(null, null)
        ChatClient.Builder("api-key", this).build()
        ConversationsClient.create(this, "token", null, null)
    }
}
