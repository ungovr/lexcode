// lexcode-expect: 0
package demo.support;

import android.app.Application;
import android.content.Context;
import com.google.firebase.analytics.FirebaseAnalytics;
import io.sentry.Sentry;
import zendesk.support.guide.HelpCenterActivity;

// Support surfaces that are not a chat: a help-center article viewer, analytics and crash reporting
// initialized by name like the chat SDKs, a static contact form.
public class SupportApp extends Application {
    private ContactForm contactForm;

    @Override
    public void onCreate() {
        super.onCreate();
        Sentry.init(options -> options.setDsn("https://example@sentry.invalid/1"));
        FirebaseAnalytics.getInstance(this);
        Analytics.init(this, "key");
        Billing.initialize(this);
    }

    // Articles only: the visitor reads, and nothing they type reaches a person or a bot.
    void showHelp(Context context) {
        HelpCenterActivity.builder().show(context);
    }

    // A form the app only saves.
    void submitContact(String email, String body) {
        contactForm.save(email, body);
    }

    // A conversations client of the app's own, not a vendor's.
    Object conversations() {
        return ConversationRepository.create("local");
    }
}
