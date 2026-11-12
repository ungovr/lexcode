// lexcode-expect: 6
package demo.bots;

import com.amazonaws.services.lexruntime.AmazonLexRuntime;
import com.amazonaws.services.lexruntime.model.PostTextRequest;
import com.google.cloud.dialogflow.v2.DetectIntentRequest;
import com.google.cloud.dialogflow.v2.SessionsClient;
import com.microsoft.bot.builder.ActivityHandler;
import com.microsoft.bot.builder.TurnContext;
import java.util.concurrent.CompletableFuture;
import software.amazon.awssdk.services.lexruntimev2.LexRuntimeV2Client;
import software.amazon.awssdk.services.lexruntimev2.model.RecognizeTextRequest;

// A conversational service called for each thing a person types: a hosted dialogue engine or a bot framework.
public class DialogueBots {
    private final LexRuntimeV2Client lexV2;
    private final AmazonLexRuntime lex;
    private final SessionsClient sessionsClient;

    public DialogueBots(LexRuntimeV2Client lexV2, AmazonLexRuntime lex, SessionsClient sessionsClient) {
        this.lexV2 = lexV2;
        this.lex = lex;
        this.sessionsClient = sessionsClient;
    }

    public Object askLexV2(RecognizeTextRequest request) {
        return lexV2.recognizeText(request);
    }

    public Object askLexV1(PostTextRequest request) {
        return lex.postText(request);
    }

    public Object askLexAudio(software.amazon.awssdk.services.lexruntimev2.model.RecognizeUtteranceRequest request,
                              software.amazon.awssdk.core.sync.RequestBody body) {
        return lexV2.recognizeUtterance(request, body);
    }

    public Object askDialogflow(DetectIntentRequest request) {
        return sessionsClient.detectIntent(request);
    }
}

class SupportBot extends ActivityHandler {
    @Override
    protected CompletableFuture<Void> onMessageActivity(TurnContext turnContext) {
        return turnContext.sendActivity("Hello, how can I help?").thenApply(r -> null);
    }
}

class DialogflowSessionBot {
    Object turn(com.google.cloud.dialogflow.cx.v3.SessionsClient sessionsClient, com.google.cloud.dialogflow.cx.v3.DetectIntentRequest request) {
        return sessionsClient.detectIntent(request);
    }
}
