// lexcode-expect: 8
package demo.support;

import android.app.Application;
import android.content.Context;
import com.freshchat.consumer.sdk.Freshchat;
import com.freshchat.consumer.sdk.FreshchatConfig;
import com.sendbird.android.SendbirdChat;
import com.twilio.conversations.ConversationsClient;
import io.getstream.chat.android.client.ChatClient;
import io.intercom.android.sdk.Intercom;
import io.smooch.core.Smooch;
import zendesk.chat.Chat;

// A vendor's chat SDK started inside the app, so the vendor receives what visitors type to support.
public class ChatApp extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        Intercom.initialize(this, "android_sdk-key", "app-id");
        Freshchat.getInstance(this).init(new FreshchatConfig("app-id", "app-key"));
        Chat.INSTANCE.init(this, "account-key");
        Smooch.init(this, null, null);
        SendbirdChat.init(null, null);
        new ChatClient.Builder("api-key", this).build();
    }

    void open(Context context) {
        Intercom.client().displayMessenger();
    }

    void conversations(Context context, String token) {
        ConversationsClient.create(context, token, null, null);
    }
}
