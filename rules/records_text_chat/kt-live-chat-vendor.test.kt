// lexcode-expect: 10
package demo.support

import android.app.Application
import android.content.Context
import com.freshchat.consumer.sdk.Freshchat
import com.freshchat.consumer.sdk.FreshchatConfig
import com.sendbird.android.SendBird
import com.sendbird.android.SendbirdChat
import com.sendbird.uikit.SendbirdUIKit
import com.twilio.conversations.ConversationsClient
import io.getstream.chat.android.client.ChatClient
import io.intercom.android.sdk.Intercom
import io.smooch.core.Smooch
import zendesk.chat.Chat

// A vendor's chat SDK started inside the app, so the vendor receives what visitors type to support.
class ChatApp : Application() {
    override fun onCreate() {
        super.onCreate()
        Intercom.initialize(this, "android_sdk-key", "app-id")
        Freshchat.getInstance(this).init(FreshchatConfig("app-id", "app-key"))
        Chat.INSTANCE.init(this, "account-key")
        Smooch.init(this, null, null)
        SendbirdChat.init(null, null)
        SendbirdUIKit.init(null, null)
        ChatClient.Builder("api-key", this).build()
    }

    fun open(context: Context) {
        Intercom.client().displayMessenger()
    }

    fun conversations(context: Context, token: String) {
        ConversationsClient.create(context, token, null, null)
    }

    fun legacySendbird() {
        SendBird.init("app-id", this)
    }
}
