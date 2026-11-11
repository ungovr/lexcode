// lexcode-expect: 8
package demo.bots

import aws.sdk.kotlin.services.lexruntimev2.LexRuntimeV2Client
import com.amazonaws.services.lexruntime.AmazonLexRuntime
import com.google.cloud.dialogflow.v2.DetectIntentRequest
import com.google.cloud.dialogflow.v2.SessionsClient
import com.microsoft.bot.builder.ActivityHandler
import com.microsoft.bot.builder.TurnContext
import java.util.concurrent.CompletableFuture

// A conversational service called for each thing a person types: a hosted dialogue engine or a bot framework.
class DialogueBots(
    private val lexV2: LexRuntimeV2Client,
    private val lex: AmazonLexRuntime,
    private val sessionsClient: SessionsClient,
) {
    suspend fun askLexV2() = lexV2.recognizeText {
        botId = "BOT"
        localeId = "en_US"
        text = "hello"
    }

    fun askLexV1(request: com.amazonaws.services.lexruntime.model.PostTextRequest) = lex.postText(request)

    suspend fun askLexAudio(request: aws.sdk.kotlin.services.lexruntimev2.model.RecognizeUtteranceRequest) =
        lexV2.recognizeUtterance(request) { it.audioStream }

    fun askDialogflow(request: DetectIntentRequest) = sessionsClient.detectIntent(request)

    fun askDialogflowParts(session: String, query: com.google.cloud.dialogflow.v2.QueryInput) =
        sessionsClient.detectIntent(session, query)
}

class SupportBot : ActivityHandler() {
    override fun onMessageActivity(turnContext: TurnContext): CompletableFuture<Void> =
        turnContext.sendActivity("Hello, how can I help?").thenApply { null }
}

class AppointmentBot(private val calendar: CalendarService) : ActivityHandler() {
    override fun onMessageActivity(turnContext: TurnContext): CompletableFuture<Void> =
        turnContext.sendActivity("Booked").thenApply { null }
}

class DialogflowSessionBot {
    fun turn(sessionsClient: com.google.cloud.dialogflow.cx.v3.SessionsClient, request: com.google.cloud.dialogflow.cx.v3.DetectIntentRequest) =
        sessionsClient.detectIntent(request)
}
